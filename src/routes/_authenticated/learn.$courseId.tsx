import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Award, CheckCircle2, Circle, FileText, HelpCircle, Loader2, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { LessonMedia } from "@/components/learn/LessonMedia";
import { QuizRunner } from "@/components/learn/QuizRunner";
import { claimCertificate, getCoursePlayer, setLessonComplete } from "@/lib/learning.functions";

export const Route = createFileRoute("/_authenticated/learn/$courseId")({
  head: () => ({
    meta: [
      { title: "Course player — Vermaak Academy" },
      { name: "description", content: "Work through your Vermaak Academy course lessons, quizzes and certificate." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Player,
});

type Item = { type: "lesson" | "quiz"; id: string; title: string; moduleId: string | null };

function Player() {
  const { courseId } = Route.useParams();
  const load = useServerFn(getCoursePlayer);
  const complete = useServerFn(setLessonComplete);
  const claim = useServerFn(claimCertificate);

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function refresh(keepActive = true) {
    const d = await load({ data: { courseId } });
    setData(d);
    if (!keepActive || !activeId) {
      const firstIncomplete = d.lessons.find((l: any) => !d.completedLessonIds.includes(l.id)) ?? d.lessons[0];
      setActiveId(firstIncomplete?.id ?? null);
    }
  }

  useEffect(() => {
    load({ data: { courseId } })
      .then((d) => {
        setData(d);
        const firstIncomplete = d.lessons.find((l: any) => !d.completedLessonIds.includes(l.id)) ?? d.lessons[0];
        setActiveId(firstIncomplete?.id ?? d.quizzes[0]?.id ?? null);
      })
      .catch((e: any) => setError(e?.message ?? "Could not open this course"));
  }, [courseId]);

  const items: Item[] = useMemo(() => {
    if (!data) return [];
    const list: Item[] = [];
    for (const m of data.modules) {
      for (const l of data.lessons.filter((x: any) => x.module_id === m.id)) {
        list.push({ type: "lesson", id: l.id, title: l.title, moduleId: m.id });
        for (const q of data.quizzes.filter((x: any) => x.lesson_id === l.id)) list.push({ type: "quiz", id: q.id, title: q.title, moduleId: m.id });
      }
      for (const q of data.quizzes.filter((x: any) => x.module_id === m.id && !x.lesson_id)) list.push({ type: "quiz", id: q.id, title: q.title, moduleId: m.id });
    }
    for (const q of data.quizzes.filter((x: any) => !x.module_id && !x.lesson_id)) list.push({ type: "quiz", id: q.id, title: q.title, moduleId: null });
    return list;
  }, [data]);

  const activeIndex = items.findIndex((i) => i.id === activeId);
  const active = items[activeIndex];
  const lesson = active?.type === "lesson" ? data?.lessons.find((l: any) => l.id === active.id) : null;
  const done: string[] = data?.completedLessonIds ?? [];

  async function markComplete(next = true) {
    if (!lesson) return;
    setSaving(true);
    try {
      const isDone = done.includes(lesson.id);
      const r = await complete({ data: { courseId, lessonId: lesson.id, completed: !isDone, secondsSpent: 0 } });
      const d = await load({ data: { courseId } });
      setData(d);
      if (!isDone && r.percent >= 100) {
        const c = await claim({ data: { courseId } });
        if (c.certificate) {
          toast.success(`Certificate issued: ${c.certificate.certificate_number}`);
          const d2 = await load({ data: { courseId } });
          setData(d2);
        }
      }
      if (!isDone && next && items[activeIndex + 1]) setActiveId(items[activeIndex + 1].id);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save progress");
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-28 pb-20 px-4">
          <div className="max-w-md mx-auto text-center rounded-2xl border border-border/60 bg-card p-8">
            <h1 className="text-xl font-bold mb-2">Course unavailable</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button asChild><Link to="/learn">Back to My Learning</Link></Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to="/learn" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" /> My Learning
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{data.course.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {data.progress.percent}% complete · {done.length}/{data.lessons.length} lessons
              </p>
            </div>
            {data.certificate && (
              <Button asChild variant="outline">
                <Link to="/certificates">
                  <Award className="h-4 w-4 mr-2" /> View certificate
                </Link>
              </Button>
            )}
          </div>

          <div className="h-2 rounded-full bg-secondary overflow-hidden mb-8">
            <div className="h-full bg-primary transition-all" style={{ width: `${data.progress.percent}%` }} />
          </div>

          <div className="grid lg:grid-cols-[320px_1fr] gap-8">
            <aside className="space-y-5">
              {data.modules.map((m: any, mi: number) => (
                <div key={m.id} className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/60">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Module {mi + 1}</p>
                    <p className="font-semibold text-sm">{m.title}</p>
                  </div>
                  <ul>
                    {items
                      .filter((i) => i.moduleId === m.id)
                      .map((i) => {
                        const isDone = i.type === "lesson" && done.includes(i.id);
                        const passed = i.type === "quiz" && (data.attempts ?? []).some((a: any) => a.quiz_id === i.id && a.passed);
                        return (
                          <li key={i.id}>
                            <button
                              onClick={() => setActiveId(i.id)}
                              className={`w-full text-left px-4 py-2.5 text-sm flex items-start gap-2.5 hover:bg-secondary ${
                                activeId === i.id ? "bg-secondary font-medium" : ""
                              }`}
                            >
                              {isDone || passed ? (
                                <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                              ) : i.type === "quiz" ? (
                                <HelpCircle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                              ) : (
                                <Circle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                              )}
                              <span>{i.title}</span>
                            </button>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              ))}
              {items.length === 0 && (
                <div className="rounded-2xl border border-border/60 bg-card p-5 text-sm text-muted-foreground">
                  The curriculum for this course is being prepared. Check back shortly.
                </div>
              )}
            </aside>

            <section>
              {active?.type === "quiz" ? (
                <QuizRunner quizId={active.id} onFinished={() => refresh(true)} />
              ) : lesson ? (
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-1">{lesson.title}</h2>
                  <p className="text-xs text-muted-foreground mb-5">
                    {lesson.kind} · {lesson.duration_minutes || 0} min {lesson.is_required ? "· required" : "· optional"}
                  </p>

                  <LessonMedia lesson={lesson} />

                  {lesson.body && (
                    <div className="prose prose-sm dark:prose-invert max-w-none mt-6 whitespace-pre-wrap">{lesson.body}</div>
                  )}

                  {lesson.transcript && (
                    <details className="mt-6 rounded-xl border border-border/60 bg-card p-4">
                      <summary className="cursor-pointer text-sm font-medium">Transcript</summary>
                      <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">{lesson.transcript}</p>
                    </details>
                  )}

                  {lesson.resources?.length > 0 && (
                    <div className="mt-6 rounded-xl border border-border/60 bg-card p-4">
                      <p className="font-semibold text-sm mb-2 inline-flex items-center gap-2">
                        <Paperclip className="h-4 w-4" /> Resources
                      </p>
                      <ul className="space-y-1.5 text-sm">
                        {lesson.resources.map((r: any) => (
                          <li key={r.id}>
                            {r.url ? (
                              <a href={r.url} target="_blank" rel="noreferrer" className="text-[var(--ocean)] hover:underline inline-flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5" /> {r.title}
                              </a>
                            ) : (
                              <span className="text-muted-foreground inline-flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5" /> {r.title}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Button variant="brand" onClick={() => markComplete(true)} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                      {done.includes(lesson.id) ? "Mark as not complete" : "Mark complete & continue"}
                    </Button>
                    {items[activeIndex + 1] && (
                      <Button variant="outline" onClick={() => setActiveId(items[activeIndex + 1].id)}>
                        Next <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-border/60 bg-card p-10 text-center text-muted-foreground">
                  Select a lesson to begin.
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
