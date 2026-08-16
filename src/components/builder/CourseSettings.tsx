import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Cat = { id: string; name: string; slug: string };
type Inst = { id: string; name: string; title: string };

const inputCls = "w-full h-10 px-3 rounded-lg bg-background border border-border text-sm";
const labelCls = "text-xs font-semibold text-muted-foreground uppercase tracking-wide";

export function CourseSettings({ course, onSaved }: { course: any; onSaved: () => void }) {
  const [cats, setCats] = useState<Cat[]>([]);
  const [insts, setInsts] = useState<Inst[]>([]);
  const [busy, setBusy] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [newInst, setNewInst] = useState("");
  const rules = (course.completion_rules ?? {}) as Record<string, any>;

  const [f, setF] = useState({
    course_type: course.course_type ?? "self_paced",
    price_ugx: course.price_ugx ?? 0,
    discount_price_ugx: course.discount_price_ugx ?? "",
    credit_cost: course.credit_cost ?? 0,
    category_id: course.category_id ?? "",
    instructor_id: course.instructor_id ?? "",
    target_audience: course.target_audience ?? "",
    estimated_minutes: course.estimated_minutes ?? 0,
    reviews_enabled: course.reviews_enabled ?? true,
    published: course.published ?? false,
    archived: !!course.archived_at,
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

  async function save() {
    setBusy(true);
    const payload = {
      course_type: f.course_type,
      price_ugx: Number(f.price_ugx) || 0,
      discount_price_ugx: f.discount_price_ugx === "" ? null : Number(f.discount_price_ugx),
      credit_cost: Number(f.credit_cost) || 0,
      category_id: f.category_id || null,
      instructor_id: f.instructor_id || null,
      target_audience: f.target_audience || null,
      estimated_minutes: Number(f.estimated_minutes) || 0,
      reviews_enabled: f.reviews_enabled,
      published: f.published,
      archived_at: f.archived ? (course.archived_at ?? new Date().toISOString()) : null,
      completion_rules: {
        require_all_lessons: f.require_all_lessons,
        require_quiz_pass: f.require_quiz_pass,
        min_score: Number(f.min_score) || 0,
      },
    };
    const { error } = await supabase.from("courses").update(payload as any).eq("id", course.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Course settings saved");
    onSaved();
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
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
          <label className={labelCls}>Slug</label>
          <input className={inputCls + " opacity-70"} value={course.slug ?? ""} readOnly />
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
          <label className={labelCls}>Category</label>
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
        <label className={labelCls}>Target audience</label>
        <textarea rows={2} className="w-full p-3 rounded-lg bg-background border border-border text-sm" value={f.target_audience} onChange={(e) => setF({ ...f, target_audience: e.target.value })} />
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
          <input type="checkbox" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} /> Published
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.reviews_enabled} onChange={(e) => setF({ ...f, reviews_enabled: e.target.checked })} /> Reviews enabled
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.archived} onChange={(e) => setF({ ...f, archived: e.target.checked })} /> Archived
        </label>
      </div>

      <Button onClick={save} disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save settings
      </Button>
    </div>
  );
}
