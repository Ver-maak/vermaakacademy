import { useEffect, useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Review = {
  id: string;
  user_id: string;
  learner_name: string;
  rating: number;
  title: string;
  body: string;
  created_at: string;
};

function Stars({ value, onChange, size = "h-4 w-4" }: { value: number; onChange?: (n: number) => void; size?: string }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        const cls = `${size} ${filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`;
        return onChange ? (
          <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}>
            <Star className={cls} />
          </button>
        ) : (
          <Star key={n} className={cls} />
        );
      })}
    </div>
  );
}

export function CourseReviews({ courseId }: { courseId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [mine, setMine] = useState<Review | null>(null);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("course_reviews")
      .select("id,user_id,learner_name,rating,title,body,created_at")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });
    const list = (data ?? []) as Review[];
    setReviews(list);
    setLoading(false);

    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id ?? null;
    setUserId(uid);
    if (!uid) return;

    const own = list.find((r) => r.user_id === uid) ?? null;
    setMine(own);
    if (own) {
      setRating(own.rating);
      setTitle(own.title);
      setBody(own.body);
    }
    const { data: enrol } = await supabase
      .from("enrolments")
      .select("id,status")
      .eq("course_id", courseId)
      .eq("user_id", uid)
      .in("status", ["active", "completed"])
      .limit(1);
    setCanReview((enrol ?? []).length > 0);
  }

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    let learner_name = mine?.learner_name ?? "";
    if (!learner_name) {
      const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();
      learner_name = prof?.full_name || "Vermaak learner";
    }
    const payload = { course_id: courseId, user_id: userId, learner_name, rating, title: title.trim(), body: body.trim() };
    const { error } = mine
      ? await supabase.from("course_reviews").update({ rating, title: payload.title, body: payload.body }).eq("id", mine.id)
      : await supabase.from("course_reviews").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(mine ? "Review updated" : "Thanks for your review!");
    setOpen(false);
    load();
  }

  const count = reviews.length;
  const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;

  return (
    <div className="mt-8 pt-6 border-t border-border/60">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="font-display font-bold text-lg">Learner reviews</h4>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Stars value={avg} />
            <span>{count ? `${avg.toFixed(1)} · ${count} review${count > 1 ? "s" : ""}` : "No reviews yet"}</span>
          </div>
        </div>
        {canReview && (
          <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
            {mine ? "Edit your review" : "Write a review"}
          </Button>
        )}
      </div>

      {open && canReview && (
        <form onSubmit={submit} className="mb-6 p-4 rounded-xl border border-border/60 bg-secondary/30 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Your rating</span>
            <Stars value={rating} onChange={setRating} size="h-5 w-5" />
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="Headline (optional)"
            className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={1500}
            rows={4}
            placeholder="What did you learn? How was the pace and support?"
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
          />
          <div className="flex gap-2">
            <Button type="submit" variant="brand" size="sm" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : mine ? "Save changes" : "Post review"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading reviews…</p>
      ) : count === 0 ? (
        <p className="text-sm text-muted-foreground">
          {canReview ? "Be the first to review this course." : "Reviews appear here once enrolled learners share their experience."}
        </p>
      ) : (
        <ul className="space-y-4">
          {reviews.slice(0, 8).map((r) => (
            <li key={r.id} className="p-4 rounded-xl border border-border/60">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-sm">{r.learner_name || "Vermaak learner"}</span>
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <div className="mt-1"><Stars value={r.rating} /></div>
              {r.title && <p className="font-semibold text-sm mt-2">{r.title}</p>}
              {r.body && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{r.body}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
