import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, XCircle, AlertTriangle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { verifyPaymentStatus } from "@/lib/payments.functions";

type Search = { tx_ref?: string };

export const Route = createFileRoute("/_authenticated/payment/status")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    tx_ref: typeof search.tx_ref === "string" ? search.tx_ref : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Payment status — Vermaak Academy" },
      { name: "description", content: "Confirmation of your Vermaak Academy enrolment payment." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaymentStatus,
});

function PaymentStatus() {
  const { tx_ref } = Route.useSearch();
  const verify = useServerFn(verifyPaymentStatus);
  const [state, setState] = useState<"loading" | "paid" | "failed" | "unconfigured" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!tx_ref) {
      setState("error");
      setMessage("No transaction reference was provided.");
      return;
    }
    verify({ data: { txRef: tx_ref } })
      .then((r) => setState(r.status))
      .catch((e: any) => {
        setState("error");
        setMessage(e?.message ?? "Verification failed");
      });
  }, [tx_ref]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-20 px-4">
        <div className="max-w-lg mx-auto text-center rounded-2xl border border-border/60 bg-card p-8">
          {state === "loading" && (
            <>
              <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary mb-4" />
              <h1 className="text-2xl font-bold">Confirming your payment…</h1>
            </>
          )}
          {state === "paid" && (
            <>
              <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
              <h1 className="text-2xl font-bold mb-2">Payment successful</h1>
              <p className="text-muted-foreground mb-6">You are enrolled. Your course is ready in My Learning.</p>
              <Button asChild><Link to="/learn">Start learning</Link></Button>
            </>
          )}
          {state === "failed" && (
            <>
              <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h1 className="text-2xl font-bold mb-2">Payment not completed</h1>
              <p className="text-muted-foreground mb-6">The transaction was not successful. You can try again from your order.</p>
              <Button asChild variant="outline"><Link to="/courses">Back to courses</Link></Button>
            </>
          )}
          {state === "unconfigured" && (
            <>
              <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
              <h1 className="text-2xl font-bold mb-2">Payments not live yet</h1>
              <p className="text-muted-foreground">The payment gateway has not been connected yet. Your application is saved and our team will be in touch.</p>
            </>
          )}
          {state === "error" && (
            <>
              <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
              <h1 className="text-2xl font-bold mb-2">We could not verify this payment</h1>
              <p className="text-muted-foreground">{message}</p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
