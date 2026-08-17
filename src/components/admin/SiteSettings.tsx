import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, ShieldCheck, UserPlus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type General = {
  site_name: string;
  tagline: string;
  contact_email: string;
  contact_phone: string;
  cities: string;
  base_students: number;
  base_partners: number;
  countries: number;
  currency: string;
  enrolment_open: boolean;
  facebook: string;
  instagram: string;
  linkedin: string;
  x: string;
};

const defaults: General = {
  site_name: "Vermaak Academy",
  tagline: "",
  contact_email: "vermaakinc1@gmail.com",
  contact_phone: "",
  cities: "Kampala · Nairobi",
  base_students: 500,
  base_partners: 3,
  countries: 2,
  currency: "UGX",
  enrolment_open: true,
  facebook: "",
  instagram: "",
  linkedin: "",
  x: "",
};

type Staff = { user_id: string; email: string; role: string };

const inputCls = "w-full h-10 px-3 rounded-lg bg-background border border-border text-sm";
const labelCls = "text-xs font-medium uppercase tracking-wider text-muted-foreground";

export function SiteSettings() {
  const [form, setForm] = useState<General>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [staff, setStaff] = useState<Staff[]>([]);
  const [roleEmail, setRoleEmail] = useState("");
  const [role, setRole] = useState("instructor");
  const [roleBusy, setRoleBusy] = useState(false);

  async function load() {
    const [{ data: s }, { data: st }] = await Promise.all([
      supabase.from("site_settings").select("value").eq("key", "general").maybeSingle(),
      supabase.rpc("admin_list_staff"),
    ]);
    if (s?.value) setForm({ ...defaults, ...(s.value as Partial<General>) });
    setStaff(((st as Staff[]) ?? []).filter((r) => r.role !== "user"));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "general", value: form as never, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Settings saved");
  }

  async function grant(e: React.FormEvent) {
    e.preventDefault();
    if (!roleEmail.trim()) return toast.error("Email required");
    setRoleBusy(true);
    const { error } = await supabase.rpc("admin_set_user_role", { _email: roleEmail.trim(), _role: role as never });
    setRoleBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${roleEmail.trim()} is now ${role}`);
    setRoleEmail("");
    load();
  }

  async function revoke(row: Staff) {
    if (!confirm(`Remove the ${row.role} role from ${row.email}?`)) return;
    const { error } = await supabase.rpc("admin_revoke_user_role", { _email: row.email, _role: row.role as never });
    if (error) return toast.error(error.message);
    toast.success("Role removed");
    load();
  }

  if (loading) {
    return (
      <div className="py-16 grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const set = <K extends keyof General>(k: K, v: General[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-8">
      <form onSubmit={save} className="space-y-6">
        <div className="p-6 rounded-2xl bg-card border border-border/60 space-y-4">
          <h2 className="font-display font-bold text-lg">Brand & contact</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className={labelCls}>Site name</span>
              <input className={inputCls} value={form.site_name} onChange={(e) => set("site_name", e.target.value)} />
            </label>
            <label className="space-y-1.5">
              <span className={labelCls}>Contact email</span>
              <input type="email" className={inputCls} value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} />
            </label>
            <label className="space-y-1.5">
              <span className={labelCls}>Contact phone</span>
              <input className={inputCls} value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} />
            </label>
            <label className="space-y-1.5">
              <span className={labelCls}>Cities</span>
              <input className={inputCls} value={form.cities} onChange={(e) => set("cities", e.target.value)} />
            </label>
          </div>
          <label className="space-y-1.5 block">
            <span className={labelCls}>Tagline</span>
            <textarea rows={2} className="w-full p-3 rounded-lg bg-background border border-border text-sm resize-none" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
          </label>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border/60 space-y-4">
          <h2 className="font-display font-bold text-lg">Homepage impact numbers</h2>
          <p className="text-sm text-muted-foreground">These baselines are added to the live counts pulled from the database.</p>
          <div className="grid sm:grid-cols-3 gap-3">
            <label className="space-y-1.5">
              <span className={labelCls}>Base students</span>
              <input type="number" className={inputCls} value={form.base_students} onChange={(e) => set("base_students", Number(e.target.value))} />
            </label>
            <label className="space-y-1.5">
              <span className={labelCls}>Base partners</span>
              <input type="number" className={inputCls} value={form.base_partners} onChange={(e) => set("base_partners", Number(e.target.value))} />
            </label>
            <label className="space-y-1.5">
              <span className={labelCls}>Countries reached</span>
              <input type="number" className={inputCls} value={form.countries} onChange={(e) => set("countries", Number(e.target.value))} />
            </label>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border/60 space-y-4">
          <h2 className="font-display font-bold text-lg">Enrolment & payments</h2>
          <div className="grid sm:grid-cols-2 gap-3 items-end">
            <label className="space-y-1.5">
              <span className={labelCls}>Display currency</span>
              <input className={inputCls} value={form.currency} onChange={(e) => set("currency", e.target.value)} />
            </label>
            <label className="inline-flex items-center gap-2 h-10 text-sm">
              <input type="checkbox" checked={form.enrolment_open} onChange={(e) => set("enrolment_open", e.target.checked)} className="h-4 w-4" />
              Accept new enrolments site-wide
            </label>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border/60 space-y-4">
          <h2 className="font-display font-bold text-lg">Social links</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {(["facebook", "instagram", "linkedin", "x"] as const).map((k) => (
              <label key={k} className="space-y-1.5">
                <span className={labelCls}>{k === "x" ? "X (Twitter)" : k}</span>
                <input className={inputCls} placeholder="https://" value={form[k]} onChange={(e) => set(k, e.target.value)} />
              </label>
            ))}
          </div>
        </div>

        <Button type="submit" variant="brand" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />} Save settings
        </Button>
      </form>

      <div className="space-y-4 h-fit lg:sticky lg:top-24">
        <div className="p-6 rounded-2xl bg-card border border-border/60 space-y-4">
          <h2 className="font-display font-bold text-lg inline-flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[var(--cyan)]" /> Team & roles
          </h2>
          <form onSubmit={grant} className="space-y-2">
            <input className={inputCls} placeholder="person@email.com" value={roleEmail} onChange={(e) => setRoleEmail(e.target.value)} />
            <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </select>
            <Button type="submit" variant="outline" className="w-full" disabled={roleBusy}>
              {roleBusy ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <UserPlus className="h-4 w-4 mr-1.5" />} Grant role
            </Button>
            <p className="text-xs text-muted-foreground">The person must already have an account on the platform.</p>
          </form>

          <div className="space-y-2 pt-2 border-t border-border/60">
            {staff.length === 0 && <p className="text-sm text-muted-foreground">No staff roles yet.</p>}
            {staff.map((s) => (
              <div key={`${s.user_id}-${s.role}`} className="flex items-center gap-2 text-sm">
                <div className="flex-1 min-w-0">
                  <div className="truncate">{s.email}</div>
                  <div className="text-xs text-muted-foreground capitalize">{s.role.replace("_", " ")}</div>
                </div>
                <button
                  type="button"
                  onClick={() => revoke(s)}
                  aria-label={`Remove ${s.role} role from ${s.email}`}
                  className="h-8 w-8 rounded-full inline-flex items-center justify-center text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
