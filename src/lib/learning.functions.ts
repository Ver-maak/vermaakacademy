import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const courseIdSchema = z.object({ courseId: z.string().uuid() });

async function assertAccess(supabaseAdmin: any, userId: string, courseId: string) {
  const { data } = await supabaseAdmin
    .from("enrolments")
    .select("id,status")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .in("status", ["active", "completed"])
    .maybeSingle();
  if (data) return data;
  const { data: staff } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).in("role", ["admin", "super_admin", "instructor"]);
  if (staff && staff.length) return { id: "staff", status: "active" };
  throw new Error("You are not enrolled in this course");
}

async function signedMedia(supabaseAdmin: any, path: string | null) {
  if (!path) return null;
  const { data } = await supabaseAdmin.storage.from("lesson-media").createSignedUrl(path, 60 * 60 * 4);
  return data?.signedUrl ?? null;
}

/** Full player payload: curriculum, lesson content, quizzes (no correct answers), progress. */
export const getCoursePlayer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => courseIdSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAccess(supabaseAdmin, userId, data.courseId);

    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("id,title,description,thumbnail_url,level,estimated_minutes,completion_rules,certificate")
      .eq("id", data.courseId)
      .maybeSingle();
    if (!course) throw new Error("Course not found");

    const [{ data: modules }, { data: lessons }, { data: quizzes }, { data: lp }, { data: cp }, { data: attempts }, { data: cert }] =
      await Promise.all([
        supabaseAdmin.from("course_modules").select("id,title,summary,position").eq("course_id", data.courseId).is("archived_at", null).order("position"),
        supabaseAdmin
          .from("lessons")
          .select("id,module_id,title,kind,body,media_url,media_path,duration_minutes,is_required,position,transcript")
          .eq("course_id", data.courseId)
          .is("archived_at", null)
          .order("position"),
        supabaseAdmin.from("quizzes").select("id,title,description,module_id,lesson_id,pass_mark,max_attempts,is_mandatory,position").eq("course_id", data.courseId).order("position"),
        supabaseAdmin.from("lesson_progress").select("lesson_id,completed_at").eq("user_id", userId).eq("course_id", data.courseId),
        supabaseAdmin.from("course_progress").select("percent,completed_at,last_lesson_id").eq("user_id", userId).eq("course_id", data.courseId).maybeSingle(),
        supabaseAdmin.from("quiz_attempts").select("quiz_id,score,passed,attempt_no").eq("user_id", userId).eq("course_id", data.courseId),
        supabaseAdmin.from("certificates").select("certificate_number,issued_at,status,final_score,learner_name").eq("user_id", userId).eq("course_id", data.courseId).maybeSingle(),
      ]);

    const lessonIds = (lessons ?? []).map((l: any) => l.id);
    const { data: resources } = lessonIds.length
      ? await supabaseAdmin.from("lesson_resources").select("id,lesson_id,title,url,file_path").in("lesson_id", lessonIds)
      : { data: [] as any[] };

    const withMedia = await Promise.all(
      (lessons ?? []).map(async (l: any) => ({
        ...l,
        media_signed_url: l.media_path ? await signedMedia(supabaseAdmin, l.media_path) : null,
        resources: (resources ?? []).filter((r: any) => r.lesson_id === l.id),
      })),
    );

    const done = new Set((lp ?? []).filter((r: any) => r.completed_at).map((r: any) => r.lesson_id));

    return {
      course,
      modules: modules ?? [],
      lessons: withMedia,
      quizzes: quizzes ?? [],
      completedLessonIds: [...done],
      attempts: attempts ?? [],
      progress: cp ?? { percent: 0, completed_at: null, last_lesson_id: null },
      certificate: cert ?? null,
    };
  });

async function recomputeProgress(supabaseAdmin: any, userId: string, courseId: string, lastLessonId: string | null) {
  const [{ data: lessons }, { data: lp }] = await Promise.all([
    supabaseAdmin.from("lessons").select("id,is_required").eq("course_id", courseId).is("archived_at", null),
    supabaseAdmin.from("lesson_progress").select("lesson_id,completed_at").eq("user_id", userId).eq("course_id", courseId),
  ]);
  const required = (lessons ?? []).filter((l: any) => l.is_required);
  const pool = required.length ? required : lessons ?? [];
  const done = new Set((lp ?? []).filter((r: any) => r.completed_at).map((r: any) => r.lesson_id));
  const completedCount = pool.filter((l: any) => done.has(l.id)).length;
  const percent = pool.length ? Math.round((completedCount / pool.length) * 100) : 0;

  await supabaseAdmin.from("course_progress").upsert(
    {
      user_id: userId,
      course_id: courseId,
      percent,
      last_lesson_id: lastLessonId,
      completed_at: percent >= 100 ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,course_id" },
  );
  return percent;
}

export const setLessonComplete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ courseId: z.string().uuid(), lessonId: z.string().uuid(), completed: z.boolean(), secondsSpent: z.number().int().min(0).max(86400).default(0) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAccess(supabaseAdmin, userId, data.courseId);

    const { data: existing } = await supabaseAdmin
      .from("lesson_progress")
      .select("id,seconds_spent")
      .eq("user_id", userId)
      .eq("lesson_id", data.lessonId)
      .maybeSingle();

    const payload = {
      user_id: userId,
      course_id: data.courseId,
      lesson_id: data.lessonId,
      completed_at: data.completed ? new Date().toISOString() : null,
      seconds_spent: (existing?.seconds_spent ?? 0) + data.secondsSpent,
    };
    if (existing) await supabaseAdmin.from("lesson_progress").update(payload).eq("id", existing.id);
    else await supabaseAdmin.from("lesson_progress").insert(payload);

    const percent = await recomputeProgress(supabaseAdmin, userId, data.courseId, data.lessonId);
    return { percent };
  });

/** Quiz questions and options WITHOUT correctness flags. */
export const getQuiz = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ quizId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: quiz } = await supabaseAdmin.from("quizzes").select("*").eq("id", data.quizId).maybeSingle();
    if (!quiz) throw new Error("Quiz not found");
    await assertAccess(supabaseAdmin, userId, quiz.course_id);

    const { data: questions } = await supabaseAdmin
      .from("quiz_questions")
      .select("id,prompt,kind,points,position")
      .eq("quiz_id", quiz.id)
      .order("position");
    const qIds = (questions ?? []).map((q: any) => q.id);
    const { data: answers } = qIds.length
      ? await supabaseAdmin.from("quiz_answers").select("id,question_id,label,position").in("question_id", qIds).order("position")
      : { data: [] as any[] };
    const { data: attempts } = await supabaseAdmin
      .from("quiz_attempts")
      .select("id,attempt_no,score,passed,created_at")
      .eq("user_id", userId)
      .eq("quiz_id", quiz.id)
      .order("attempt_no", { ascending: false });

    return {
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        pass_mark: quiz.pass_mark,
        max_attempts: quiz.max_attempts,
        course_id: quiz.course_id,
      },
      questions: (questions ?? []).map((q: any) => ({
        ...q,
        options: (answers ?? []).filter((a: any) => a.question_id === q.id).map((a: any) => ({ id: a.id, label: a.label })),
      })),
      attempts: attempts ?? [],
      attemptsUsed: (attempts ?? []).length,
    };
  });

function certificateNumber() {
  const y = new Date().getFullYear();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `VA-${y}-${rand}`;
}

export const submitQuizAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        quizId: z.string().uuid(),
        responses: z.array(z.object({ questionId: z.string().uuid(), answerIds: z.array(z.string().uuid()).max(20), text: z.string().max(4000).default("") })).max(200),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: quiz } = await supabaseAdmin.from("quizzes").select("*").eq("id", data.quizId).maybeSingle();
    if (!quiz) throw new Error("Quiz not found");
    await assertAccess(supabaseAdmin, userId, quiz.course_id);

    const { data: prior } = await supabaseAdmin.from("quiz_attempts").select("attempt_no").eq("user_id", userId).eq("quiz_id", quiz.id);
    const used = (prior ?? []).length;
    if (quiz.max_attempts > 0 && used >= quiz.max_attempts) throw new Error("You have used all attempts for this quiz");

    const { data: questions } = await supabaseAdmin.from("quiz_questions").select("id,points,kind").eq("quiz_id", quiz.id);
    const qIds = (questions ?? []).map((q: any) => q.id);
    const { data: answers } = qIds.length
      ? await supabaseAdmin.from("quiz_answers").select("id,question_id,is_correct").in("question_id", qIds)
      : { data: [] as any[] };

    let earned = 0;
    let total = 0;
    const perQuestion: Record<string, boolean> = {};
    for (const q of questions ?? []) {
      const points = q.points || 1;
      total += points;
      const correctIds = (answers ?? []).filter((a: any) => a.question_id === q.id && a.is_correct).map((a: any) => a.id);
      const given = data.responses.find((r) => r.questionId === q.id)?.answerIds ?? [];
      const ok =
        correctIds.length > 0 &&
        correctIds.length === given.length &&
        correctIds.every((id: string) => given.includes(id));
      perQuestion[q.id] = ok;
      if (ok) earned += points;
    }
    const score = total ? Math.round((earned / total) * 100) : 0;
    const passed = score >= (quiz.pass_mark || 0);

    await supabaseAdmin.from("quiz_attempts").insert({
      user_id: userId,
      quiz_id: quiz.id,
      course_id: quiz.course_id,
      attempt_no: used + 1,
      score,
      passed,
      responses: { answers: data.responses, perQuestion },
    });

    const certificate = await maybeIssueCertificate(supabaseAdmin, userId, quiz.course_id);

    return {
      score,
      passed,
      passMark: quiz.pass_mark,
      attemptsUsed: used + 1,
      attemptsAllowed: quiz.max_attempts,
      perQuestion,
      certificate,
    };
  });

async function maybeIssueCertificate(supabaseAdmin: any, userId: string, courseId: string) {
  const { data: existing } = await supabaseAdmin
    .from("certificates")
    .select("certificate_number,issued_at,status,final_score,learner_name,course_title")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();
  if (existing) return existing;

  const [{ data: course }, { data: cp }, { data: quizzes }, { data: attempts }] = await Promise.all([
    supabaseAdmin.from("courses").select("id,title,completion_rules").eq("id", courseId).maybeSingle(),
    supabaseAdmin.from("course_progress").select("percent").eq("user_id", userId).eq("course_id", courseId).maybeSingle(),
    supabaseAdmin.from("quizzes").select("id,is_mandatory,pass_mark").eq("course_id", courseId),
    supabaseAdmin.from("quiz_attempts").select("quiz_id,score,passed").eq("user_id", userId).eq("course_id", courseId),
  ]);
  if (!course) return null;

  const rules = (course.completion_rules ?? {}) as any;
  const minPercent = Number(rules.min_progress_percent ?? 100);
  const percent = cp?.percent ?? 0;
  if (percent < minPercent) return null;

  const mandatory = (quizzes ?? []).filter((q: any) => q.is_mandatory);
  const passedAll = mandatory.every((q: any) => (attempts ?? []).some((a: any) => a.quiz_id === q.id && a.passed));
  if (!passedAll) return null;

  const scores = (attempts ?? []).map((a: any) => a.score);
  const finalScore = scores.length ? Math.round(scores.reduce((s: number, n: number) => s + n, 0) / scores.length) : percent;

  const { data: profile } = await supabaseAdmin.from("profiles").select("full_name,email").eq("id", userId).maybeSingle();

  const { data: inserted, error } = await supabaseAdmin
    .from("certificates")
    .insert({
      user_id: userId,
      course_id: courseId,
      course_title: course.title,
      learner_name: profile?.full_name || profile?.email || "Vermaak Academy Learner",
      certificate_number: certificateNumber(),
      final_score: finalScore,
      status: "issued",
    })
    .select("certificate_number,issued_at,status,final_score,learner_name,course_title")
    .maybeSingle();
  if (error) return null;

  await supabaseAdmin.from("enrolments").update({ status: "completed" }).eq("user_id", userId).eq("course_id", courseId);
  return inserted;
}

/** Called when a learner finishes all lessons, so certificates issue for quiz-free courses too. */
export const claimCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => courseIdSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAccess(supabaseAdmin, userId, data.courseId);
    const cert = await maybeIssueCertificate(supabaseAdmin, userId, data.courseId);
    return { certificate: cert };
  });

export const getMyCertificates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("certificates")
      .select("id,certificate_number,course_title,learner_name,final_score,issued_at,status")
      .eq("user_id", userId)
      .order("issued_at", { ascending: false });
    return { certificates: data ?? [] };
  });

/** Public certificate verification by number. */
export const verifyCertificate = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ number: z.string().min(3).max(60) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.rpc("verify_certificate", { _number: data.number });
    if (error) return { found: false as const, certificate: null };
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) return { found: false as const, certificate: null };
    return { found: true as const, certificate: row };
  });
