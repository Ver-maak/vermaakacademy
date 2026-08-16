import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, Loader2, Search, XCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { verifyCertificate } from "@/lib/learning.functions";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "Verify a certificate — Vermaak Academy" },
      { name: "description", content: "Check the authenticity of a Vermaak Academy certificate using its certificate number." },
      { property: "og:title", content: "Verify a Vermaak Academy certificate" },
      { property: "og:description", content: "Confirm a learner's Vermaak Academy certificate in seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Verify,
});

function Verify() {
  const verify = useServerFn(verifyCertificate);
  const [number, setNumber] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "found" | "missing">("idle");
  const [cert, setCert] = useState<any>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (number.trim().length < 3) return;
    setState("loading");
    const r = await verify({ data: { number: number.trim() } });
    if (r.found) {
      setCert(r.certificate);
      setState("found");
    } else {
      setCert(null);
      setState("missing");
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-20 px-4">
        <div className="max-w-xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Verify a certificate</h1>
          <p className="text-muted-foreground mb-8">
            Enter the certificate number printed on the certificate (for example VA-2026-A1B2C3).
          </p>

          <form onSubmit={onSubmit} className="flex gap-2">
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Certificate number"
              aria-label="Certificate number"
              className="flex-1 h-11 px-4 rounded-lg bg-background border border-border text-sm"
            />
            <Button type="submit" variant="brand" disabled={state === "loading"}>
              {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Verify</span>
            </Button>
          </form>

          {state === "found" && cert && (
            <div className="mt-8 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-6">
              <p className="inline-flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400 mb-4">
                <BadgeCheck className="h-5 w-5" /> Valid certificate
              </p>
              <dl className="grid sm:grid-cols-2 gap-4 text-sm">
                <div><dt className="text-muted-foreground">Learner</dt><dd className="font-medium">{cert.learner_name}</dd></div>
                <div><dt className="text-muted-foreground">Course</dt><dd className="font-medium">{cert.course_title}</dd></div>
                <div><dt className="text-muted-foreground">Issued</dt><dd className="font-medium">{new Date(cert.issued_at).toLocaleDateString()}</dd></div>
                <div><dt className="text-muted-foreground">Status</dt><dd className="font-medium capitalize">{cert.status}</dd></div>
                <div><dt className="text-muted-foreground">Certificate no.</dt><dd className="font-medium">{cert.certificate_number}</dd></div>
              </dl>
            </div>
          )}

          {state === "missing" && (
            <div className="mt-8 rounded-2xl border border-destructive/40 bg-destructive/5 p-6">
              <p className="inline-flex items-center gap-2 font-semibold text-destructive">
                <XCircle className="h-5 w-5" /> No certificate found with that number
              </p>
              <p className="text-sm text-muted-foreground mt-2">Check for typing errors, or contact us at vermaakinc1@gmail.com.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
