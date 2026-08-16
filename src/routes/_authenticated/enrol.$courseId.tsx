import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { createEnrolmentOrder } from "@/lib/payments.functions";

export const Route = createFileRoute("/_authenticated/enrol/$courseId")({
  head: () => ({
    meta: [
      { title: "Enrol — Vermaak Academy" },
      { name: "description", content: "Complete your enrolment application for a Vermaak Academy course." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Enrol,
});

const inputCls = "w-full h-11 px-3 rounded-lg bg-background border border-border text-sm";
const labelCls = "text-xs font-semibold text-muted-foreground uppercase tracking-wide";

function Enrol() {
  const { courseId } = Route.useParams();
  const navigate = useNavigate();
  const submit = useServerFn(createEnrolmentOrder);
  const [course, setCourse] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    full_name: "",
    email: "",
    phone: "",
    country: "Uganda",
    city: "",
    gender: "",
    organisation: "",
    occupation: "",
    motivation: "",
    heard_from: "",
    agreed_terms: false,
  });

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: auth }] = await Promise.all([
        supabase.from("courses").select("id,title,price_ugx,discount_price_ugx,currency,thumbnail_url,duration,level").eq("id", courseId).maybeSingle(),
        supabase.auth.getUser(),
      ]);
      setCourse(c ?? null);
      const email = auth.user?.email ?? "";
      const { data: profile } = auth.user
        ? await supabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle()
        : { data: null as any };
      setF((p) => ({
        ...p,
        email: profile?.email || email,
        full_name: profile?.full_name || p.full_name,
        phone: profile?.phone || p.phone,
        country: profile?.country || p.country,
        city: profile?.city || p.city,
        gender: profile?.gender || p.gender,
        organisation: profile?.organisation || p.organisation,
        occupation: profile?.occupation || p.occupation,
        heard_from: profile?.heard_from || p.heard_from,
      }));
    })();
  }, [courseId]);

  const amount = Number(course?.discount_price_ugx ?? course?.price_ugx ?? 0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.agreed_terms) return toast.error("Please accept the terms to continue");
    if (f.motivation.trim().length < 10) return toast.error("Tell us a bit more about your motivation");
    setBusy(true);
    try {
      const res = await submit({ data: { courseId, ...f, agreed_terms: true } as any });
      if (res.alreadyEnrolled) {
        toast.success("You are already enrolled in this course");
        navigate({ to: "/learn" });
        return;
      }
      if (res.amount === 0) {
        toast.success("Enrolment complete — happy learning!");
        navigate({ to: "/learn" });
        return;
      }
      navigate({ to: "/checkout/$orderId", params: { orderId: res.orderId! } });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not submit your application");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <Link to="/courses" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to courses
          </Link>
          <h1 className="text-3xl font-bold mb-1">Enrolment application</h1>
          <p className="text-muted-foreground mb-6">
            {course ? course.title : "Loading course…"}
            {amount > 0 && course ? ` · ${(course.currency ?? "UGX")} ${amount.toLocaleString()}` : course ? " · Free" : ""}
          </p>

          <form onSubmit={onSubmit} className="rounded-2xl border border-border/60 bg-card p-5 sm:p-7 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Full name *</label>
                <input required className={inputCls} value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Email *</label>
                <input required type="email" className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Phone *</label>
                <input required className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Country *</label>
                <input required className={inputCls} value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>City *</label>
                <input required className={inputCls} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Gender</label>
                <select className={inputCls} value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })}>
                  <option value="">Prefer not to say</option>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Organisation</label>
                <input className={inputCls} value={f.organisation} onChange={(e) => setF({ ...f, organisation: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Occupation</label>
                <input className={inputCls} value={f.occupation} onChange={(e) => setF({ ...f, occupation: e.target.value })} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Why do you want to take this course? *</label>
              <textarea required rows={4} className="w-full p-3 rounded-lg bg-background border border-border text-sm" value={f.motivation} onChange={(e) => setF({ ...f, motivation: e.target.value })} />
            </div>

            <div>
              <label className={labelCls}>How did you hear about us?</label>
              <input className={inputCls} value={f.heard_from} onChange={(e) => setF({ ...f, heard_from: e.target.value })} />
            </div>

            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" checked={f.agreed_terms} onChange={(e) => setF({ ...f, agreed_terms: e.target.checked })} />
              I agree to the Vermaak Academy learner terms and privacy policy.
            </label>

            <Button type="submit" disabled={busy} className="w-full">
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {amount > 0 ? "Continue to payment" : "Complete enrolment"}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
