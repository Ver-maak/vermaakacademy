import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, X, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).default(""),
  motivation: z.string().trim().max(2000).default(""),
});

type Props = {
  open: boolean;
  onClose: () => void;
  course?: { id: string; title: string } | null;
};

export function EnrollForm({ open, onClose, course }: Props) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", motivation: "" });

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please fix the form");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("course_enrollments").insert({
      ...parsed.data,
      course_id: course?.id ?? null,
      course_title: course?.title ?? "General interest",
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Enrollment received — we'll email you the next steps.");
    setForm({ name: "", email: "", phone: "", motivation: "" });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-card border border-border/60 soft-shadow p-7">
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 h-9 w-9 rounded-full hover:bg-secondary inline-flex items-center justify-center"><X className="h-4 w-4" /></button>
        <div className="h-12 w-12 rounded-2xl gradient-brand flex items-center justify-center mb-3"><GraduationCap className="h-6 w-6 text-white" /></div>
        <h2 className="font-display font-extrabold text-2xl">Enroll now</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {course ? <>You're enrolling in <strong className="text-foreground">{course.title}</strong>.</> : "Tell us about yourself and the team will get in touch."}
        </p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <input required placeholder="Full name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-11 px-4 rounded-xl bg-background border border-border" />
          <div className="grid sm:grid-cols-2 gap-3">
            <input type="email" required placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11 px-4 rounded-xl bg-background border border-border" />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11 px-4 rounded-xl bg-background border border-border" />
          </div>
          <textarea placeholder="Why do you want to take this course?" rows={4} value={form.motivation} onChange={(e) => setForm({ ...form, motivation: e.target.value })} className="w-full p-3 rounded-xl bg-background border border-border resize-none" />
          <Button type="submit" variant="brand" className="w-full h-11" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit enrollment"}
          </Button>
        </form>
      </div>
    </div>
  );
}
