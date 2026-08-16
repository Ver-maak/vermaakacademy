import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Quiz = {
  id: string;
  title: string;
  description: string;
  module_id: string | null;
  pass_mark: number;
  max_attempts: number;
  is_mandatory: boolean;
  position: number;
};
type Question = { id: string; quiz_id: string; prompt: string; kind: string; explanation: string; points: number; position: number };
type Answer = { id: string; question_id: string; label: string; is_correct: boolean; position: number };

const inputCls = "w-full h-10 px-3 rounded-lg bg-background border border-border text-sm";
const labelCls = "text-xs font-semibold text-muted-foreground uppercase tracking-wide";

export function QuizBuilder({ courseId }: { courseId: string }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [modules, setModules] = useState<{ id: string; title: string }[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [openQuiz, setOpenQuiz] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const [{ data: q }, { data: m }] = await Promise.all([
      supabase.from("quizzes").select("id,title,description,module_id,pass_mark,max_attempts,is_mandatory,position").eq("course_id", courseId).order("position"),
      supabase.from("course_modules").select("id,title").eq("course_id", courseId).is("archived_at", null).order("position"),
    ]);
    const qs = (q as Quiz[]) ?? [];
    setQuizzes(qs);
    setModules((m as { id: string; title: string }[]) ?? []);
    if (qs.length) {
      const ids = qs.map((x) => x.id);
      const { data: qq } = await supabase.from("quiz_questions").select("id,quiz_id,prompt,kind,explanation,points,position").in("quiz_id", ids).order("position");
      const questionRows = (qq as Question[]) ?? [];
      setQuestions(questionRows);
      if (questionRows.length) {
        const { data: aa } = await supabase.from("quiz_answers").select("id,question_id,label,is_correct,position").in("question_id", questionRows.map((x) => x.id)).order("position");
        setAnswers((aa as Answer[]) ?? []);
      } else setAnswers([]);
    } else {
      setQuestions([]);
      setAnswers([]);
    }
  }

  useEffect(() => {
    refresh();
  }, [courseId]);

  async function addQuiz() {
    const title = newTitle.trim();
    if (!title) return toast.error("Quiz title required");
    setBusy(true);
    const { error } = await supabase.from("quizzes").insert({ course_id: courseId, title, position: quizzes.length + 1 } as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    setNewTitle("");
    toast.success("Quiz created");
    refresh();
  }

  async function saveQuiz(q: Quiz) {
    const { error } = await supabase
      .from("quizzes")
      .update({
        title: q.title,
        description: q.description ?? "",
        module_id: q.module_id || null,
        pass_mark: Number(q.pass_mark) || 0,
        max_attempts: Number(q.max_attempts) || 1,
        is_mandatory: q.is_mandatory,
      } as any)
      .eq("id", q.id);
    if (error) return toast.error(error.message);
    toast.success("Quiz saved");
  }

  async function deleteQuiz(q: Quiz) {
    if (!confirm(`Delete quiz "${q.title}" with all questions?`)) return;
    const { error } = await supabase.from("quizzes").delete().eq("id", q.id);
    if (error) return toast.error(error.message);
    refresh();
  }

  async function addQuestion(quizId: string) {
    const count = questions.filter((x) => x.quiz_id === quizId).length;
    const { data, error } = await supabase
      .from("quiz_questions")
      .insert({ quiz_id: quizId, prompt: `Question ${count + 1}`, kind: "single", position: count + 1 } as any)
      .select("id")
      .single();
    if (error) return toast.error(error.message);
    const qid = (data as { id: string }).id;
    await supabase.from("quiz_answers").insert([
      { question_id: qid, label: "Option A", is_correct: true, position: 1 },
      { question_id: qid, label: "Option B", is_correct: false, position: 2 },
    ] as any);
    refresh();
  }

  async function saveQuestion(qn: Question) {
    const rows = answers.filter((a) => a.question_id === qn.id);
    if (!rows.some((a) => a.is_correct)) return toast.error("Mark at least one correct answer");
    const { error } = await supabase
      .from("quiz_questions")
      .update({ prompt: qn.prompt, kind: qn.kind, explanation: qn.explanation ?? "", points: Number(qn.points) || 1 } as any)
      .eq("id", qn.id);
    if (error) return toast.error(error.message);
    for (const a of rows) {
      const { error: aErr } = await supabase.from("quiz_answers").update({ label: a.label, is_correct: a.is_correct } as any).eq("id", a.id);
      if (aErr) return toast.error(aErr.message);
    }
    toast.success("Question saved");
  }

  async function deleteQuestion(id: string) {
    const { error } = await supabase.from("quiz_questions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }

  async function addAnswer(questionId: string) {
    const count = answers.filter((a) => a.question_id === questionId).length;
    const { error } = await supabase.from("quiz_answers").insert({ question_id: questionId, label: `Option ${count + 1}`, position: count + 1 } as any);
    if (error) return toast.error(error.message);
    refresh();
  }

  async function deleteAnswer(id: string) {
    const { error } = await supabase.from("quiz_answers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <input className={inputCls} placeholder="New quiz title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
        <Button onClick={addQuiz} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />} Add quiz</Button>
      </div>

      {quizzes.length === 0 && <p className="text-sm text-muted-foreground">No quizzes yet. Assessments are optional but required for certificates when enabled.</p>}

      {quizzes.map((q) => {
        const qOpen = openQuiz === q.id;
        const qQuestions = questions.filter((x) => x.quiz_id === q.id);
        return (
          <div key={q.id} className="rounded-xl border border-border/60 overflow-hidden">
            <div className="flex items-center gap-2 p-3 bg-secondary/40">
              <button className="flex-1 text-left font-semibold text-sm" onClick={() => setOpenQuiz(qOpen ? null : q.id)}>
                {q.title} <span className="font-normal text-muted-foreground">· {qQuestions.length} question(s) · pass {q.pass_mark}%</span>
              </button>
              <button onClick={() => deleteQuiz(q)} className="p-1.5 rounded hover:bg-background text-destructive" aria-label="Delete quiz"><Trash2 className="h-4 w-4" /></button>
            </div>

            {qOpen && (
              <div className="p-4 space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Title</label>
                    <input className={inputCls} value={q.title} onChange={(e) => setQuizzes(quizzes.map((x) => (x.id === q.id ? { ...x, title: e.target.value } : x)))} />
                  </div>
                  <div>
                    <label className={labelCls}>Attached module (optional)</label>
                    <select className={inputCls} value={q.module_id ?? ""} onChange={(e) => setQuizzes(quizzes.map((x) => (x.id === q.id ? { ...x, module_id: e.target.value || null } : x)))}>
                      <option value="">Final course quiz</option>
                      {modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Pass mark (%)</label>
                    <input type="number" min={0} max={100} className={inputCls} value={q.pass_mark} onChange={(e) => setQuizzes(quizzes.map((x) => (x.id === q.id ? { ...x, pass_mark: Number(e.target.value) } : x)))} />
                  </div>
                  <div>
                    <label className={labelCls}>Max attempts</label>
                    <input type="number" min={1} className={inputCls} value={q.max_attempts} onChange={(e) => setQuizzes(quizzes.map((x) => (x.id === q.id ? { ...x, max_attempts: Number(e.target.value) } : x)))} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <textarea rows={2} className="w-full p-3 rounded-lg bg-background border border-border text-sm" value={q.description ?? ""} onChange={(e) => setQuizzes(quizzes.map((x) => (x.id === q.id ? { ...x, description: e.target.value } : x)))} />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={q.is_mandatory} onChange={(e) => setQuizzes(quizzes.map((x) => (x.id === q.id ? { ...x, is_mandatory: e.target.checked } : x)))} /> Mandatory
                  </label>
                  <Button size="sm" variant="outline" onClick={() => saveQuiz(q)}><Save className="h-4 w-4 mr-1" /> Save quiz</Button>
                </div>

                <div className="space-y-4">
                  {qQuestions.map((qn, i) => {
                    const opts = answers.filter((a) => a.question_id === qn.id).sort((a, b) => a.position - b.position);
                    return (
                      <div key={qn.id} className="rounded-lg border border-border/60 p-3 space-y-3">
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-semibold mt-2">Q{i + 1}</span>
                          <textarea rows={2} className="flex-1 p-2 rounded-lg bg-background border border-border text-sm" value={qn.prompt} onChange={(e) => setQuestions(questions.map((x) => (x.id === qn.id ? { ...x, prompt: e.target.value } : x)))} />
                          <button onClick={() => deleteQuestion(qn.id)} className="p-1.5 text-destructive"><Trash2 className="h-4 w-4" /></button>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-3">
                          <div>
                            <label className={labelCls}>Kind</label>
                            <select className={inputCls} value={qn.kind} onChange={(e) => setQuestions(questions.map((x) => (x.id === qn.id ? { ...x, kind: e.target.value } : x)))}>
                              <option value="single">Single choice</option>
                              <option value="multiple">Multiple choice</option>
                              <option value="true_false">True / False</option>
                            </select>
                          </div>
                          <div>
                            <label className={labelCls}>Points</label>
                            <input type="number" min={1} className={inputCls} value={qn.points} onChange={(e) => setQuestions(questions.map((x) => (x.id === qn.id ? { ...x, points: Number(e.target.value) } : x)))} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          {opts.map((a) => (
                            <div key={a.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={a.is_correct}
                                onChange={(e) => setAnswers(answers.map((x) => (x.id === a.id ? { ...x, is_correct: e.target.checked } : x)))}
                                aria-label="Correct answer"
                              />
                              <input className={inputCls} value={a.label} onChange={(e) => setAnswers(answers.map((x) => (x.id === a.id ? { ...x, label: e.target.value } : x)))} />
                              <button onClick={() => deleteAnswer(a.id)} className="p-1.5 text-destructive"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          ))}
                          <Button size="sm" variant="ghost" onClick={() => addAnswer(qn.id)}><Plus className="h-4 w-4 mr-1" /> Add option</Button>
                        </div>
                        <div>
                          <label className={labelCls}>Explanation (shown after grading)</label>
                          <textarea rows={2} className="w-full p-2 rounded-lg bg-background border border-border text-sm" value={qn.explanation ?? ""} onChange={(e) => setQuestions(questions.map((x) => (x.id === qn.id ? { ...x, explanation: e.target.value } : x)))} />
                        </div>
                        <Button size="sm" onClick={() => saveQuestion(qn)}><Save className="h-4 w-4 mr-1" /> Save question</Button>
                      </div>
                    );
                  })}
                  <Button size="sm" variant="outline" onClick={() => addQuestion(q.id)}><Plus className="h-4 w-4 mr-1" /> Add question</Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
