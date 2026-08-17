import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Cat = { id: string; name: string; slug: string };
type Inst = { id: string; name: string; title: string };
type Visibility = "draft" | "hidden" | "published";

const inputCls = "w-full h-10 px-3 rounded-lg bg-background border border-border text-sm";
const areaCls = "w-full p-3 rounded-lg bg-background border border-border text-sm";
const labelCls = "text-xs font-semibold text-muted-foreground uppercase tracking-wide";

function visibilityOf(course: any): Visibility {
  if (course.archived_at) return "hidden";
  return course.published ? "published" : "draft";
}

function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CourseSettings({ course, onSaved }: { course: any; onSaved: () => void }) {
  const [cats, setCats] = useState<Cat[]>([]);
  const [insts, setInsts] = useState<Inst[]>([]);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [newCat, setNewCat] = useState("");
  const [newInst, setNewInst] = useState("");
  const rules = (course.completion_rules ?? {}) as Record<string, any>;

  const [f, setF] = useState({
    visibility: visibilityOf(course) as Visibility,
    title: course.title ?? "",
    description: course.description ?? "",
    full_description: course.full_description ?? "",
    category: course.category ?? "",
    level: course.level ?? "Beginner",
    duration: course.duration ?? "",
    prerequisites: course.prerequisites ?? "",
    certificate: course.certificate ?? "",
    course_type: course.course_type ?? "self_paced",
    price_ugx: course.price_ugx ?? 0,
    discount_price_ugx: course.discount_price_ugx ?? "",
    credit_cost: course.credit_cost ?? 0,
    category_id: course.category_id ?? "",
    instructor_id: course.instructor_id ?? "",
    target_audience: course.target_audience ?? "",
    estimated_minutes: course.estimated_minutes ?? 0,
    registration_start: toLocalInput(course.registration_start),
    registration_end: toLocalInput(course.registration_end),
    featured: course.featured ?? false,
    pinned: course.pinned ?? false,
    reviews_enabled: course.reviews_enabled ?? true,
    require_all_lessons: rules.require_all_lessons ?? true,
    require_quiz_pass: rules.require_quiz_pass ?? true,
    min_score: rules.min_score ?? 70,
  });

  async function loadLookups() {
    const [{ data: c }, { data: i }] = await Promise.all([
      supabase.from("course_categories").select("id,name,slug").order("name"),
      supabase.from("instructors").select("id,name,title").order("name"),
    ]);
    setCats((c as Cat[]) ?? []);
    setInsts((i as Inst[]) ?? []);
  }

  useEffect(() => {
    loadLookups();
  }, []);

  async function addCategory() {
    const name = newCat.trim();
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { data, error } = await supabase.from("course_categories").insert({ name, slug }).select("id,name,slug").single();
    if (error) return toast.error(error.message);
    setNewCat("");
    await loadLookups();
    setF((p) => ({ ...p, category_id: (data as Cat).id }));
    toast.success("Category added");
  }

  async function addInstructor() {
    const name = newInst.trim();
    if (!name) return;
    const { data, error } = await supabase.from("instructors").insert({ name }).select("id,name,title").single();
    if (error) return toast.error(error.message);
    setNewInst("");
    await loadLookups();
    setF((p) => ({ ...p, instructor_id: (data as Inst).id }));
    toast.success("Instructor added");
  }

  const buildPayload = useCallback(
    (s: typeof f) => ({
      title: s.title || course.title,
      description: s.description ?? "",
      full_description: s.full_description || null,
      category: s.category ?? "",
      level: s.level ?? "",
      duration: s.duration ?? "",
      prerequisites: s.prerequisites || null,
      certificate: s.certificate || null,
      course_type: s.course_type,
      price_ugx: Number(s.price_ugx) || 0,
      discount_price_ugx: s.discount_price_ugx === "" ? null : Number(s.discount_price_ugx),
      credit_cost: Number(s.credit_cost) || 0,
      category_id: s.category_id || null,
      instructor_id: s.instructor_id || null,
      target_audience: s.target_audience || null,
      estimated_minutes: Number(s.estimated_minutes) || 0,
      registration_start: s.registration_start ? new Date(s.registration_start).toISOString() : null,
      registration_end: s.registration_end ? new Date(s.registration_end).toISOString() : null,
      featured: s.featured,
      pinned: s.pinned,
      pinned_at: s.pinned ? (course.pinned_at ?? new Date().toISOString()) : null,
      reviews_enabled: s.reviews_enabled,
      published: s.visibility === "published",
      archived_at: s.visibility === "hidden" ? (course.archived_at ?? new Date().toISOString()) : null,
      completion_rules: {
        require_all_lessons: s.require_all_lessons,
        require_quiz_pass: s.require_quiz_pass,
        min_score: Number(s.min_score) || 0,
      },
    }),
    [course.title, course.archived_at, course.pinned_at],
  );

  async function persist(s: typeof f, opts?: { silent?: boolean }) {
    setBusy(true);
    const { error } = await supabase.from("courses").update(buildPayload(s) as any).eq("id", course.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    setSavedAt(Date.now());
    if (!opts?.silent) toast.success("Course settings saved");
    onSaved();
  }

  // Live edits: debounce-save any change
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => persist(f, { silent: true }), 900);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [f]);

  const vis: { id: Visibility; label: string; hint: string }[] = [
    { id: "draft", label: "Draft", hint: "Only staff can see it — invisible on the site." },
    { id: "hidden", label: "Hidden", hint: "Archived: removed from listings, existing learners keep access." },
    { id: "published", label: "Published", hint: "Live in the course library and open to enrolment." },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="font-semibold text-sm">Course settings</p>
        <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
          {busy ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
            </>
          ) : savedAt ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" /> All changes saved
            </>
          ) : (
            "Changes save automatically"
          )}
        </p>
      </div>

      <div className="rounded-xl border border-border/60 p-4">
        <label className={labelCls}>Visibility</label>
        <div className="mt-2 grid sm:grid-cols-3 gap-2">
          {vis.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setF({ ...f, visibility: v.id })}
              className={`text-left p-3 rounded-lg border text-sm transition ${
                f.visibility === v.id ? "border-primary bg-primary/10" : "border-border hover:bg-secondary"
              }`}
            >
              <span className="font-semibold block">{v.label}</span>
              <span className="text-xs text-muted-foreground">{v.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Title</label>
          <input className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Slug</label>
          <input className={inputCls + " opacity-70"} value={course.slug ?? ""} readOnly />
        </div>
        <div>
          <label className={labelCls}>Category label</label>
          <input className={inputCls} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Level</label>
          <select className={inputCls} value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })}>
            {["Beginner", "Intermediate", "Advanced", "All levels"].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Duration (display)</label>
          <input className={inputCls} value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} placeholder="8 weeks" />
        </div>
        <div>
          <label className={labelCls}>Course type</label>
          <select className={inputCls} value={f.course_type} onChange={(e) => setF({ ...f, course_type: e.target.value })}>
            <option value="self_paced">Self-paced</option>
            <option value="cohort">Cohort</option>
            <option value="live">Live</option>
            <option value="free">Free</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Price (UGX)</label>
          <input type="number" min={0} className={inputCls} value={f.price_ugx} onChange={(e) => setF({ ...f, price_ugx: e.target.value as any })} />
        </div>
        <div>
          <label className={labelCls}>Discounted price (UGX, optional)</label>
          <input type="number" min={0} className={inputCls} value={f.discount_price_ugx} onChange={(e) => setF({ ...f, discount_price_ugx: e.target.value as any })} />
        </div>
        <div>
          <label className={labelCls}>Credit cost</label>
          <input type="number" min={0} className={inputCls} value={f.credit_cost} onChange={(e) => setF({ ...f, credit_cost: e.target.value as any })} />
        </div>
        <div>
          <label className={labelCls}>Estimated minutes</label>
          <input type="number" min={0} className={inputCls} value={f.estimated_minutes} onChange={(e) => setF({ ...f, estimated_minutes: e.target.value as any })} />
        </div>
        <div>
          <label className={labelCls}>Registration opens (optional)</label>
          <input type="datetime-local" className={inputCls} value={f.registration_start} onChange={(e) => setF({ ...f, registration_start: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Registration closes (optional)</label>
          <input type="datetime-local" className={inputCls} value={f.registration_end} onChange={(e) => setF({ ...f, registration_end: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Category (taxonomy)</label>
          <select className={inputCls} value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}>
            <option value="">— none —</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="flex gap-2 mt-2">
            <input className={inputCls} placeholder="New category name" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
            <Button type="button" variant="outline" size="icon" onClick={addCategory}><Plus className="h-4 w-4" /></Button>
          </div>
        </div>
        <div>
          <label className={labelCls}>Instructor</label>
          <select className={inputCls} value={f.instructor_id} onChange={(e) => setF({ ...f, instructor_id: e.target.value })}>
            <option value="">— none —</option>
            {insts.map((i) => (
              <option key={i.id} value={i.id}>{i.name}{i.title ? ` — ${i.title}` : ""}</option>
            ))}
          </select>
          <div className="flex gap-2 mt-2">
            <input className={inputCls} placeholder="New instructor name" value={newInst} onChange={(e) => setNewInst(e.target.value)} />
            <Button type="button" variant="outline" size="icon" onClick={addInstructor}><Plus className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      <div>
        <label className={labelCls}>Short description</label>
        <textarea rows={2} className={areaCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
      </div>
      <div>
        <label className={labelCls}>Full description</label>
        <textarea rows={4} className={areaCls} value={f.full_description} onChange={(e) => setF({ ...f, full_description: e.target.value })} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Prerequisites</label>
          <textarea rows={2} className={areaCls} value={f.prerequisites} onChange={(e) => setF({ ...f, prerequisites: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Certificate</label>
          <textarea rows={2} className={areaCls} value={f.certificate} onChange={(e) => setF({ ...f, certificate: e.target.value })} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Target audience</label>
        <textarea rows={2} className={areaCls} value={f.target_audience} onChange={(e) => setF({ ...f, target_audience: e.target.value })} />
      </div>

      <div className="rounded-xl border border-border/60 p-4 space-y-3">
        <p className="font-semibold text-sm">Completion rules</p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.require_all_lessons} onChange={(e) => setF({ ...f, require_all_lessons: e.target.checked })} />
          Require all required lessons completed
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.require_quiz_pass} onChange={(e) => setF({ ...f, require_quiz_pass: e.target.checked })} />
          Require passing all mandatory quizzes
        </label>
        <div className="max-w-[200px]">
          <label className={labelCls}>Minimum final score (%)</label>
          <input type="number" min={0} max={100} className={inputCls} value={f.min_score} onChange={(e) => setF({ ...f, min_score: e.target.value as any })} />
        </div>
      </div>

      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.featured} onChange={(e) => setF({ ...f, featured: e.target.checked })} /> Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.pinned} onChange={(e) => setF({ ...f, pinned: e.target.checked })} /> Pinned
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.reviews_enabled} onChange={(e) => setF({ ...f, reviews_enabled: e.target.checked })} /> Reviews enabled
        </label>
      </div>

      <Button onClick={() => persist(f)} disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save now
      </Button>
    </div>
  );
}
