import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, X, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";

const schema = z.object({
  name: z.string().trim().min(1, "Name required").max(120),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().max(40).default(""),
  country: z.string().trim().max(80).default(""),
  city: z.string().trim().max(80).default(""),
  age_range: z.string().trim().max(20).default(""),
  gender: z.string().trim().max(20).default(""),
  occupation: z.string().trim().max(120).default(""),
  education_level: z.string().trim().max(60).default(""),
  experience_level: z.string().trim().max(40).default(""),
  preferred_schedule: z.string().trim().max(60).default(""),
  heard_from: z.string().trim().max(60).default(""),
  motivation: z.string().trim().max(2000).default(""),
});

type Props = {
  open: boolean;
  onClose: () => void;
  course?: { id: string; title: string; credit_cost?: number } | null;
};

const AGE = ["Under 18", "18–24", "25–34", "35–44", "45+"];
const GENDER = ["Prefer not to say", "Female", "Male", "Non-binary", "Other"];
const EDU = ["High school", "Diploma / Certificate", "Bachelor's", "Master's", "Doctorate", "Self-taught"];
const EXP = ["Complete beginner", "Some basics", "Intermediate", "Advanced"];
const SCHED = ["Weekday evenings", "Weekday daytime", "Weekends", "Flexible / Self-paced"];
const HEARD = ["Friend / Word of mouth", "Instagram", "LinkedIn", "Twitter / X", "Google search", "Partner organization", "Other"];

const inputCls = "w-full h-11 px-4 rounded-xl bg-background border border-border text-sm";
const selectCls = inputCls;

export function EnrollForm({ open, onClose, course }: Props) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", country: "", city: "",
    age_range: "", gender: "", occupation: "", education_level: "",
    experience_level: "", preferred_schedule: "", heard_from: "", motivation: "",
  });

  if (!open) return null;

  const set = <K extends keyof typeof form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please fix the form");
      return;
    }
    setBusy(true);

    // If this course costs credits, attempt to spend them first.
    if (course?.id && (course.credit_cost ?? 0) > 0) {
      const { data: spendRows, error: spendErr } = await supabase.rpc("spend_credits_for_enrollment", {
        _email: parsed.data.email,
        _course_id: course.id,
      });
      if (spendErr) {
        setBusy(false);
        return toast.error(spendErr.message);
      }
      const result = Array.isArray(spendRows) ? spendRows[0] : spendRows;
      if (!result?.success) {
        setBusy(false);
        return toast.error(
          result?.message === "Insufficient credits"
            ? `You need ${result.cost} credits but only have ${result.balance}. Contact us to top up.`
            : result?.message || "Could not process credit payment",
        );
      }
    }

    const { error } = await supabase.from("course_enrollments").insert({
      ...parsed.data,
      course_id: course?.id ?? null,
      course_title: course?.title ?? "General interest",
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Enrollment received — we'll email you the next steps.");
    setForm({
      name: "", email: "", phone: "", country: "", city: "",
      age_range: "", gender: "", occupation: "", education_level: "",
      experience_level: "", preferred_schedule: "", heard_from: "", motivation: "",
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card border border-border/60 soft-shadow p-7">
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 h-9 w-9 rounded-full hover:bg-secondary inline-flex items-center justify-center"><X className="h-4 w-4" /></button>
        <div className="h-12 w-12 rounded-2xl gradient-brand flex items-center justify-center mb-3"><GraduationCap className="h-6 w-6 text-white" /></div>
        <h2 className="font-display font-extrabold text-2xl">Enroll now</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {course ? <>You're enrolling in <strong className="text-foreground">{course.title}</strong>. Tell us a bit about you so we can tailor the experience.</> : "Tell us about yourself and our team will get in touch."}
        </p>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Your details</legend>
            <input required placeholder="Full name *" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
            <div className="grid sm:grid-cols-2 gap-3">
              <input type="email" required placeholder="Email *" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} />
              <input placeholder="Phone (with country code)" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input placeholder="Country" value={form.country} onChange={(e) => set("country", e.target.value)} className={inputCls} />
              <input placeholder="City" value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <select value={form.age_range} onChange={(e) => set("age_range", e.target.value)} className={selectCls}>
                <option value="">Age range</option>
                {AGE.map((a) => <option key={a}>{a}</option>)}
              </select>
              <select value={form.gender} onChange={(e) => set("gender", e.target.value)} className={selectCls}>
                <option value="">Gender</option>
                {GENDER.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Background</legend>
            <input placeholder="Current occupation (e.g. student, designer)" value={form.occupation} onChange={(e) => set("occupation", e.target.value)} className={inputCls} />
            <div className="grid sm:grid-cols-2 gap-3">
              <select value={form.education_level} onChange={(e) => set("education_level", e.target.value)} className={selectCls}>
                <option value="">Highest education</option>
                {EDU.map((x) => <option key={x}>{x}</option>)}
              </select>
              <select value={form.experience_level} onChange={(e) => set("experience_level", e.target.value)} className={selectCls}>
                <option value="">Experience in this field</option>
                {EXP.map((x) => <option key={x}>{x}</option>)}
              </select>
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Logistics</legend>
            <div className="grid sm:grid-cols-2 gap-3">
              <select value={form.preferred_schedule} onChange={(e) => set("preferred_schedule", e.target.value)} className={selectCls}>
                <option value="">Preferred schedule</option>
                {SCHED.map((x) => <option key={x}>{x}</option>)}
              </select>
              <select value={form.heard_from} onChange={(e) => set("heard_from", e.target.value)} className={selectCls}>
                <option value="">How did you hear about us?</option>
                {HEARD.map((x) => <option key={x}>{x}</option>)}
              </select>
            </div>
            <textarea placeholder="Why do you want to take this course? What do you hope to achieve?" rows={4} value={form.motivation} onChange={(e) => set("motivation", e.target.value)} className="w-full p-3 rounded-xl bg-background border border-border resize-none text-sm" />
          </fieldset>

          <Button type="submit" variant="brand" className="w-full h-11" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit enrollment"}
          </Button>
        </form>
      </div>
    </div>
  );
}
