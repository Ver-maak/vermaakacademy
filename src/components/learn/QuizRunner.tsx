import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, XCircle, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getQuiz, submitQuizAttempt } from "@/lib/learning.functions";

export function QuizRunner({ quizId, onFinished }: { quizId: string; onFinished?: () => void }) {
  const load = useServerFn(getQuiz);
  const submit = useServerFn(submitQuizAttempt);
  const [data, setData] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    setResult(null);
    setAnswers({});
    load({ data: { quizId } })
      .then(setData)
      .catch((e: any) => setError(e?.message ?? "Could not load quiz"));
  }, [quizId]);

  function toggle(qid: string, aid: string, multi: boolean) {
    setAnswers((prev) => {
      const cur = prev[qid] ?? [];
      if (!multi) return { ...prev, [qid]: [aid] };
      return { ...prev, [qid]: cur.includes(aid) ? cur.filter((x) => x !== aid) : [...cur, aid] };
    });
  }

  async function onSubmit() {
    setBusy(true);
    setError("");
    try {
      const r = await submit({
        data: {
          quizId,
          responses: (data.questions ?? []).map((q: any) => ({ questionId: q.id, answerIds: answers[q.id] ?? [], text: "" })),
        },
      });
      setResult(r);
      onFinished?.();
    } catch (e: any) {
      setError(e?.message ?? "Submission failed");
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) return <p className="text-sm text-destructive">{error}</p>;
  if (!data) return <div className="py-12 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  const attemptsLeft = data.quiz.max_attempts > 0 ? data.quiz.max_attempts - data.attemptsUsed : Infinity;

  if (result) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6 text-center">
        {result.passed ? (
          <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
        ) : (
          <XCircle className="h-12 w-12 mx-auto text-destructive mb-3" />
        )}
        <h3 className="text-xl font-bold mb-1">{result.passed ? "Passed" : "Not passed yet"}</h3>
        <p className="text-muted-foreground mb-4">
          You scored {result.score}% (pass mark {result.passMark}%).
          {result.attemptsAllowed > 0 && ` Attempt ${result.attemptsUsed} of ${result.attemptsAllowed}.`}
        </p>
        {result.certificate && (
          <p className="inline-flex items-center gap-2 text-sm font-medium text-[var(--ocean)] mb-4">
            <Award className="h-4 w-4" /> Certificate {result.certificate.certificate_number} issued
          </p>
        )}
        {!result.passed && (result.attemptsAllowed === 0 || result.attemptsUsed < result.attemptsAllowed) && (
          <div>
            <Button variant="outline" onClick={() => { setResult(null); setAnswers({}); load({ data: { quizId } }).then(setData); }}>
              Try again
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-bold">{data.quiz.title}</h3>
        {data.quiz.description && <p className="text-muted-foreground text-sm mt-1">{data.quiz.description}</p>}
        <p className="text-xs text-muted-foreground mt-2">
          Pass mark {data.quiz.pass_mark}% · {data.quiz.max_attempts > 0 ? `${attemptsLeft} attempt(s) left` : "Unlimited attempts"}
        </p>
      </div>

      {attemptsLeft <= 0 ? (
        <p className="text-sm text-destructive">You have used all attempts for this quiz.</p>
      ) : (
        <>
          {(data.questions ?? []).map((q: any, i: number) => {
            const multi = q.kind === "multi" || q.kind === "multiple";
            return (
              <div key={q.id} className="rounded-2xl border border-border/60 bg-card p-5">
                <p className="font-medium mb-3">
                  {i + 1}. {q.prompt}
                </p>
                <div className="space-y-2">
                  {q.options.map((o: any) => {
                    const selected = (answers[q.id] ?? []).includes(o.id);
                    return (
                      <label
                        key={o.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer text-sm ${
                          selected ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"
                        }`}
                      >
                        <input
                          type={multi ? "checkbox" : "radio"}
                          name={q.id}
                          checked={selected}
                          onChange={() => toggle(q.id, o.id, multi)}
                          className="accent-[var(--ocean)]"
                        />
                        {o.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button variant="brand" size="lg" onClick={onSubmit} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null} Submit answers
          </Button>
        </>
      )}
    </div>
  );
}
