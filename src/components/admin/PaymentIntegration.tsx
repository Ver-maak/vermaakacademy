import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, Copy, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPaymentGatewayStatus } from "@/lib/payments.functions";

export function PaymentIntegration() {
  const load = useServerFn(getPaymentGatewayStatus);
  const [status, setStatus] = useState<{ configured: boolean; missing: string[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const webhookUrl = typeof window !== "undefined" ? `${window.location.origin}/api/public/webhooks/flutterwave` : "";

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const r = await load();
      setStatus({ configured: r.configured, missing: r.missing });
    } catch (e: any) {
      setError(e?.message ?? "Could not read gateway status");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-lg">Flutterwave API integration</h2>
            <p className="text-sm text-muted-foreground">Card, mobile money and bank transfer payments for course enrolments.</p>
          </div>
          <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>

        <div className="mt-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Checking connection…</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : status?.configured ? (
            <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Connected — live checkout is enabled
            </p>
          ) : (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
              <p className="inline-flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" /> Not connected yet
              </p>
              <p className="text-muted-foreground mt-1">
                Missing credentials: {status?.missing.join(", ") || "unknown"}. Learners can still apply — orders stay pending until the
                gateway is connected.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
        <h3 className="font-semibold">Connection steps</h3>
        <ol className="list-decimal pl-5 space-y-3 text-sm text-muted-foreground">
          <li>
            In your Flutterwave dashboard open <span className="font-medium text-foreground">Settings → API Keys</span> and copy your
            <span className="font-medium text-foreground"> Secret key</span> (starts with <code>FLWSECK</code>) and
            <span className="font-medium text-foreground"> Public key</span>.
          </li>
          <li>
            Open <span className="font-medium text-foreground">Settings → Webhooks</span>, paste the webhook URL below, and set a
            <span className="font-medium text-foreground"> Secret hash</span> of your choosing (a long random string).
          </li>
          <li>
            Ask your Lovable admin to store those values as the secrets{" "}
            <code>FLUTTERWAVE_SECRET_KEY</code>, <code>FLUTTERWAVE_WEBHOOK_HASH</code> and{" "}
            <code>VITE_FLUTTERWAVE_PUBLIC_KEY</code>. They are never stored in the codebase or shown here.
          </li>
          <li>Refresh this panel — the status flips to “Connected” and checkout goes live immediately.</li>
        </ol>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Webhook URL</label>
          <div className="flex gap-2 mt-1">
            <input readOnly value={webhookUrl} className="flex-1 h-10 px-3 rounded-lg bg-background border border-border text-sm" />
            <Button variant="outline" size="icon" onClick={() => copy(webhookUrl)} aria-label="Copy webhook URL">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Flutterwave posts payment confirmations here. Requests are rejected unless the secret hash matches.
          </p>
        </div>
      </div>
    </div>
  );
}
