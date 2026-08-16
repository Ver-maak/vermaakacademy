import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Star, Search, EyeOff, Eye, Trash2, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type ReviewRow = {
  id: string;
  course_id: string;
  learner_name: string;
  rating: number;
  title: string;
  body: string;
  status: string;
  created_at: string;
};

export function ReviewsAdmin() {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const [{ data, error }, { data: courses }] = await Promise.all([
      supabase
        .from("course_reviews")
        .select("id,course_id,learner_name,rating,title,body,status,created_at")
        .order("created_at", { ascending: false }),
      supabase.from("courses").select("id,title"),
    ]);
    setLoading(false);
    if (error) return toast.error(error.message);
    setRows((data ?? []) as ReviewRow[]);
    const map: Record<string, string> = {};
    (courses ?? []).forEach((c: { id: string; title: string }) => (map[c.id] = c.title));
    setTitles(map);
  }

  useEffect(() => {
    load();
  }, []);

  async function setReviewStatus(row: ReviewRow, next: string) {
    setBusyId(row.id);
    const { error } = await supabase.from("course_reviews").update({ status: next }).eq("id", row.id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(next === "approved" ? "Review published" : "Review hidden");
    load();
  }

  async function remove(row: ReviewRow) {
    if (!window.confirm("Delete this review permanently?")) return;
    setBusyId(row.id);
    const { error } = await supabase.from("course_reviews").delete().eq("id", row.id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success("Review deleted");
    load();
  }

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!needle) return true;
      return (
        r.learner_name.toLowerCase().includes(needle) ||
        r.title.toLowerCase().includes(needle) ||
        r.body.toLowerCase().includes(needle) ||
        (titles[r.course_id] ?? "").toLowerCase().includes(needle)
      );
    });
  }, [rows, q, status, titles]);

  const avg = rows.length ? rows.reduce((s, r) => s + r.rating, 0) / rows.length : 0;

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reviews by learner, course or text…"
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-background border border-border"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 px-3 rounded-lg bg-background border border-border text-sm"
          aria-label="Filter reviews by status"
        >
          <option value="all">All</option>
          <option value="approved">Published</option>
          <option value="hidden">Hidden</option>
        </select>
        <div className="h-10 px-4 inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card text-sm">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          {rows.length ? `${avg.toFixed(1)} average · ${rows.length}` : "No reviews"}
        </div>
      </div>

      <div className="space-y-3">
        {paged(filtered).map((r) => (
          <div key={r.id} className="p-4 rounded-2xl bg-card border border-border/60">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{r.learner_name || "Learner"}</span>
                <span className="text-muted-foreground">· {titles[r.course_id] ?? "Course"}</span>
                <span className="inline-flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`h-3.5 w-3.5 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                  ))}
                </span>
                {r.status !== "approved" && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-destructive/15 text-destructive">Hidden</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                {r.status === "approved" ? (
                  <button onClick={() => setReviewStatus(r, "hidden")} disabled={busyId === r.id} className="inline-flex items-center gap-1 hover:underline disabled:opacity-50">
                    <EyeOff className="h-3.5 w-3.5" /> Hide
                  </button>
                ) : (
                  <button onClick={() => setReviewStatus(r, "approved")} disabled={busyId === r.id} className="inline-flex items-center gap-1 hover:underline disabled:opacity-50">
                    <Eye className="h-3.5 w-3.5" /> Publish
                  </button>
                )}
                <button onClick={() => remove(r)} disabled={busyId === r.id} className="inline-flex items-center gap-1 text-destructive hover:underline disabled:opacity-50">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
            {r.title && <p className="font-semibold text-sm mt-2">{r.title}</p>}
            {r.body && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{r.body}</p>}
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="p-12 text-center text-muted-foreground rounded-2xl bg-card border border-border/60">
            <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-60" />
            No reviews {rows.length ? "match your filters" : "yet"}.
          </div>
        )}
        {loading && <p className="text-muted-foreground py-8 text-center">Loading reviews…</p>}
      </div>
    </div>
  );
}

function paged<T>(list: T[]): T[] {
  return list.slice(0, 50);
}
