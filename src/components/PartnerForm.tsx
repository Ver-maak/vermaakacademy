import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, X, Handshake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";

const schema = z.object({
  name: z.string().trim().min(1, "Name required").max(120),
  role: z.string().trim().max(120).default(""),
  organization: z.string().trim().max(200).default(""),
  website: z.string().trim().max(200).default(""),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().max(40).default(""),
  country: z.string().trim().max(80).default(""),
  city: z.string().trim().max(80).default(""),
  industry: z.string().trim().max(80).default(""),
  organization_size: z.string().trim().max(40).default(""),
  partnership_type: z.string().trim().max(80).default(""),
  budget_range: z.string().trim().max(40).default(""),
  timeline: z.string().trim().max(40).default(""),
  goals: z.string().trim().max(2000).default(""),
  message: z.string().trim().max(2000).default(""),
});

type Props = { open: boolean; onClose: () => void };

const TYPES = ["Corporate partnership", "Curriculum collaboration", "Hiring partner", "Sponsorship", "Mentor / Instructor", "Scholarship funder", "Media / Press", "Other"];
const SIZES = ["1–10", "11–50", "51–200", "201–1000", "1000+"];
const BUDGET = ["Under $1k", "$1k–$5k", "$5k–$25k", "$25k–$100k", "$100k+", "In-kind / Non-monetary"];
const TIMELINE = ["Within 1 month", "1–3 months", "3–6 months", "6+ months", "Just exploring"];
const INDUSTRIES = ["Education", "Technology", "Finance", "Media & Creative", "Government / NGO", "Healthcare", "Retail", "Other"];

const inputCls = "w-full h-11 px-4 rounded-xl bg-background border border-border text-sm";

export function PartnerForm({ open, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "", role: "", organization: "", website: "", email: "", phone: "",
    country: "", city: "", industry: INDUSTRIES[0], organization_size: SIZES[0],
    partnership_type: TYPES[0], budget_range: BUDGET[0], timeline: TIMELINE[0],
    goals: "", message: "",
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
    const { error } = await supabase.from("partner_inquiries").insert(parsed.data);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Thanks — our team will be in touch shortly.");
    setForm({
      name: "", role: "", organization: "", website: "", email: "", phone: "",
      country: "", city: "", industry: INDUSTRIES[0], organization_size: SIZES[0],
      partnership_type: TYPES[0], budget_range: BUDGET[0], timeline: TIMELINE[0],
      goals: "", message: "",
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card border border-border/60 soft-shadow p-7">
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 h-9 w-9 rounded-full hover:bg-secondary inline-flex items-center justify-center"><X className="h-4 w-4" /></button>
        <div className="h-12 w-12 rounded-2xl gradient-brand flex items-center justify-center mb-3"><Handshake className="h-6 w-6 text-white" /></div>
        <h2 className="font-display font-extrabold text-2xl">Partner with Vermaak</h2>
        <p className="text-sm text-muted-foreground mt-1">Share a bit about your organization and how you'd like to collaborate. The more detail, the faster we can route you to the right team.</p>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">About you</legend>
            <div className="grid sm:grid-cols-2 gap-3">
              <input required placeholder="Full name *" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
              <input placeholder="Your role / title" value={form.role} onChange={(e) => set("role", e.target.value)} className={inputCls} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input type="email" required placeholder="Email *" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} />
              <input placeholder="Phone (with country code)" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Organization</legend>
            <div className="grid sm:grid-cols-2 gap-3">
              <input placeholder="Organization name" value={form.organization} onChange={(e) => set("organization", e.target.value)} className={inputCls} />
              <input placeholder="Website" value={form.website} onChange={(e) => set("website", e.target.value)} className={inputCls} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input placeholder="Country" value={form.country} onChange={(e) => set("country", e.target.value)} className={inputCls} />
              <input placeholder="City" value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <select value={form.industry} onChange={(e) => set("industry", e.target.value)} className={inputCls}>
                {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
              </select>
              <select value={form.organization_size} onChange={(e) => set("organization_size", e.target.value)} className={inputCls}>
                {SIZES.map((s) => <option key={s}>{s} people</option>)}
              </select>
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Partnership</legend>
            <select value={form.partnership_type} onChange={(e) => set("partnership_type", e.target.value)} className={inputCls}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <div className="grid sm:grid-cols-2 gap-3">
              <select value={form.budget_range} onChange={(e) => set("budget_range", e.target.value)} className={inputCls}>
                {BUDGET.map((b) => <option key={b}>{b}</option>)}
              </select>
              <select value={form.timeline} onChange={(e) => set("timeline", e.target.value)} className={inputCls}>
                {TIMELINE.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <textarea placeholder="What outcomes are you hoping for? (goals, audience, success metrics)" rows={3} value={form.goals} onChange={(e) => set("goals", e.target.value)} className="w-full p-3 rounded-xl bg-background border border-border resize-none text-sm" />
            <textarea placeholder="Anything else we should know?" rows={3} value={form.message} onChange={(e) => set("message", e.target.value)} className="w-full p-3 rounded-xl bg-background border border-border resize-none text-sm" />
          </fieldset>

          <Button type="submit" variant="brand" className="w-full h-11" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit inquiry"}
          </Button>
        </form>
      </div>
    </div>
  );
}
