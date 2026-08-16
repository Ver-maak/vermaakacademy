import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { startFlutterwaveCheckout } from "@/lib/payments.functions";

export const Route = createFileRoute("/_authenticated/checkout/$orderId")({
  head: () => ({
    meta: [
      { title: "Checkout — Vermaak Academy" },
      { name: "description", content: "Securely complete payment for your Vermaak Academy enrolment." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { orderId } = Route.useParams();
  const startCheckout = useServerFn(startFlutterwaveCheckout);
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notConfigured, setNotConfigured] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("id,order_number,amount,currency,status,course_id,courses(title,thumbnail_url)")
        .eq("id", orderId)
        .maybeSingle();
      setOrder(data ?? null);
      setLoading(false);
    })();
  }, [orderId]);

  async function pay() {
    setBusy(true);
    setNotConfigured(null);
    try {
      const res = await startCheckout({ data: { orderId, origin: window.location.origin } });
      if (res.alreadyPaid) {
        toast.success("This order is already paid");
        return;
      }
      if (res.link) window.location.href = res.link;
    } catch (e: any) {
      const msg = e?.message ?? "Could not start checkout";
      if (msg.toLowerCase().includes("not configured")) setNotConfigured(msg);
      else toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-20 px-4">
        <div className="max-w-xl mx-auto">
          <Link to="/courses" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to courses
          </Link>
          <h1 className="text-3xl font-bold mb-6">Checkout</h1>

          {loading ? (
            <div className="py-16 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : !order ? (
            <p className="text-muted-foreground">Order not found.</p>
          ) : (
            <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Order {order.order_number}</p>
                <h2 className="text-xl font-semibold mt-1">{order.courses?.title}</h2>
              </div>
              <div className="flex items-baseline justify-between border-t border-border/60 pt-4">
                <span className="text-muted-foreground">Amount due</span>
                <span className="text-2xl font-bold">{order.currency} {Number(order.amount).toLocaleString()}</span>
              </div>

              {order.status === "paid" ? (
                <div className="space-y-3">
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Payment received — you now have access.</p>
                  <Button asChild className="w-full"><Link to="/learn">Go to My Learning</Link></Button>
                </div>
              ) : (
                <>
                  <Button onClick={pay} disabled={busy} className="w-full">
                    {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                    Pay with Flutterwave
                  </Button>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" /> Card, mobile money and bank transfer · payments processed securely by Flutterwave.
                  </p>
                  {notConfigured && (
                    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
                      <p className="font-semibold mb-1">Payment gateway not connected yet</p>
                      <p className="text-muted-foreground">
                        An administrator still needs to add the Flutterwave API keys under Dashboard → Payments. Your application has been
                        saved — you can return to this order once payments are live.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
