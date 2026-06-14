import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Loader2, MailX, CheckCircle2, AlertCircle } from "lucide-react";

const searchSchema = z.object({ token: z.string().uuid().optional() });

export const Route = createFileRoute("/unsubscribe")({
  validateSearch: (s) => searchSchema.parse(s),
  component: UnsubscribePage,
  head: () => ({
    meta: [
      { title: "Unsubscribe · Vermaak Academy" },
      { name: "description", content: "Unsubscribe from Vermaak Academy newsletters." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

type State =
  | { kind: "loading" }
  | { kind: "invalid" }
  | { kind: "confirm"; email: string }
  | { kind: "already"; email: string }
  | { kind: "done"; email: string }
  | { kind: "error"; message: string };

function UnsubscribePage() {
  const { token } = Route.useSearch();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) return setState({ kind: "invalid" });
      const { data, error } = await supabase.rpc("get_subscriber_by_token", { _token: token });
      if (cancelled) return;
      if (error) return setState({ kind: "error", message: error.message });
      const row = Array.isArray(data) ? data[0] : null;
      if (!row?.email) return setState({ kind: "invalid" });
      setState(row.already_unsubscribed ? { kind: "already", email: row.email } : { kind: "confirm", email: row.email });
    })();
    return () => { cancelled = true; };
  }, [token]);

  async function confirm() {
    if (!token || state.kind !== "confirm") return;
    setWorking(true);
    const { data, error } = await supabase.rpc("unsubscribe_newsletter", { _token: token });
    setWorking(false);
    if (error) return setState({ kind: "error", message: error.message });
    const row = Array.isArray(data) ? data[0] : null;
    if (!row?.success) return setState({ kind: "invalid" });
    setState({ kind: "done", email: row.email ?? state.email });
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <section className="flex-1 grid place-items-center px-5 py-20">
        <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-8 text-center shadow-sm">
          {state.kind === "loading" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Checking your link…</p>
            </div>
          )}

          {state.kind === "invalid" && (
            <>
              <div className="mx-auto h-12 w-12 rounded-full bg-destructive/15 text-destructive grid place-items-center mb-4"><AlertCircle className="h-6 w-6" /></div>
              <h1 className="font-display text-2xl font-bold">Invalid link</h1>
              <p className="mt-2 text-sm text-muted-foreground">This unsubscribe link is invalid or has expired.</p>
            </>
          )}

          {state.kind === "error" && (
            <>
              <div className="mx-auto h-12 w-12 rounded-full bg-destructive/15 text-destructive grid place-items-center mb-4"><AlertCircle className="h-6 w-6" /></div>
              <h1 className="font-display text-2xl font-bold">Something went wrong</h1>
              <p className="mt-2 text-sm text-muted-foreground">{state.message}</p>
            </>
          )}

          {state.kind === "already" && (
            <>
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 grid place-items-center mb-4"><CheckCircle2 className="h-6 w-6" /></div>
              <h1 className="font-display text-2xl font-bold">Already unsubscribed</h1>
              <p className="mt-2 text-sm text-muted-foreground"><span className="font-medium text-foreground">{state.email}</span> is no longer receiving newsletters.</p>
            </>
          )}

          {state.kind === "confirm" && (
            <>
              <div className="mx-auto h-12 w-12 rounded-full bg-secondary text-foreground grid place-items-center mb-4"><MailX className="h-6 w-6" /></div>
              <h1 className="font-display text-2xl font-bold">Unsubscribe from Vermaak?</h1>
              <p className="mt-2 text-sm text-muted-foreground">We'll stop sending newsletters to <span className="font-medium text-foreground">{state.email}</span>.</p>
              <div className="mt-6 flex justify-center gap-3">
                <Button variant="brand" onClick={confirm} disabled={working}>
                  {working ? "Unsubscribing…" : "Yes, unsubscribe"}
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">Changed your mind? Just close this page.</p>
            </>
          )}

          {state.kind === "done" && (
            <>
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 grid place-items-center mb-4"><CheckCircle2 className="h-6 w-6" /></div>
              <h1 className="font-display text-2xl font-bold">You're unsubscribed</h1>
              <p className="mt-2 text-sm text-muted-foreground"><span className="font-medium text-foreground">{state.email}</span> will no longer receive our newsletters. Sorry to see you go.</p>
            </>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
