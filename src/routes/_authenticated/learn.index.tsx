import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/learn/")({
  head: () => ({
    meta: [
      { title: "My Learning — Vermaak Academy" },
      { name: "description", content: "Your enrolled Vermaak Academy courses and progress." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyLearning,
});

function MyLearning() {
  const [rows, setRows] = useState<any[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: enrolments } = await supabase
        .from("enrolments")
        .select("id,status,created_at,course_id,courses(title,thumbnail_url,duration,level,estimated_minutes)")
        .in("status", ["active", "completed"])
        .order("created_at", { ascending: false });
      const { data: prog } = await supabase.from("course_progress").select("course_id,percent");
      setRows(enrolments ?? []);
      setProgress(Object.fromEntries((prog ?? []).map((p: any) => [p.course_id, p.percent])));
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">My Learning</h1>
          <p className="text-muted-foreground mb-8">
            Everything you are enrolled in, in one place.{" "}
            <Link to="/certificates" className="text-[var(--ocean)] hover:underline">View my certificates</Link>
          </p>

          {loading ? (
            <div className="py-16 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-card p-10 text-center">
              <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-semibold mb-1">No courses yet</p>
              <p className="text-muted-foreground mb-5">Browse the catalogue and enrol to start learning.</p>
              <Button asChild><Link to="/courses">Explore courses</Link></Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {rows.map((e) => {
                const pct = progress[e.course_id] ?? 0;
                return (
                  <div key={e.id} className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                    {e.courses?.thumbnail_url && (
                      <img src={e.courses.thumbnail_url} alt={`${e.courses.title} course cover`} loading="lazy" className="h-36 w-full object-cover" />
                    )}
                    <div className="p-4">
                      <h2 className="font-semibold leading-snug mb-1">{e.courses?.title}</h2>
                      <p className="text-xs text-muted-foreground mb-3">
                        {e.courses?.level} · {e.courses?.duration || `${e.courses?.estimated_minutes ?? 0} min`}
                      </p>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden mb-2">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{pct}% complete · {e.status}</p>
                      <Button asChild variant="brand" size="sm" className="w-full">
                        <Link to="/learn/$courseId" params={{ courseId: e.course_id }}>
                          {pct > 0 ? "Continue" : "Start course"}
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
