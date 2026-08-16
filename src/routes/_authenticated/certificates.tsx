import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Award, Loader2, Printer } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { getMyCertificates } from "@/lib/learning.functions";

export const Route = createFileRoute("/_authenticated/certificates")({
  head: () => ({
    meta: [
      { title: "My certificates — Vermaak Academy" },
      { name: "description", content: "Download and share the certificates you have earned at Vermaak Academy." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Certificates,
});

function Certificates() {
  const load = useServerFn(getMyCertificates);
  const [rows, setRows] = useState<any[] | null>(null);

  useEffect(() => {
    load().then((r) => setRows(r.certificates));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 print:hidden">My certificates</h1>
          <p className="text-muted-foreground mb-8 print:hidden">
            Each certificate carries a unique number anyone can check on the{" "}
            <Link to="/verify" className="text-[var(--ocean)] hover:underline">verification page</Link>.
          </p>

          {rows === null ? (
            <div className="py-16 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-card p-10 text-center">
              <Award className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-semibold mb-1">No certificates yet</p>
              <p className="text-muted-foreground mb-5">Complete a course and pass its assessments to earn one.</p>
              <Button asChild><Link to="/learn">Continue learning</Link></Button>
            </div>
          ) : (
            <div className="space-y-8">
              {rows.map((c) => (
                <article key={c.id} className="rounded-2xl border-4 border-[var(--ocean)]/30 bg-card p-8 text-center break-inside-avoid">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Vermaak Academy</p>
                  <h2 className="text-2xl font-bold mt-4">Certificate of Completion</h2>
                  <p className="text-muted-foreground mt-4 text-sm">This certifies that</p>
                  <p className="text-2xl font-bold text-[var(--ocean)] mt-1">{c.learner_name}</p>
                  <p className="text-muted-foreground mt-4 text-sm">has successfully completed</p>
                  <p className="text-lg font-semibold mt-1">{c.course_title}</p>
                  <div className="mt-6 grid sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
                    <div><span className="block font-semibold text-foreground">{new Date(c.issued_at).toLocaleDateString()}</span>Issued</div>
                    <div><span className="block font-semibold text-foreground">{c.final_score}%</span>Final score</div>
                    <div><span className="block font-semibold text-foreground">{c.certificate_number}</span>Certificate no.</div>
                  </div>
                  {c.status !== "issued" && <p className="mt-4 text-xs font-semibold text-destructive uppercase">{c.status}</p>}
                  <div className="mt-6 print:hidden">
                    <Button variant="outline" onClick={() => window.print()}>
                      <Printer className="h-4 w-4 mr-2" /> Download / print PDF
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <div className="print:hidden"><Footer /></div>
    </div>
  );
}
