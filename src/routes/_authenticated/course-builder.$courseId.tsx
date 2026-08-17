import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { CourseSettings } from "@/components/builder/CourseSettings";
import { CurriculumEditor } from "@/components/builder/CurriculumEditor";
import { QuizBuilder } from "@/components/builder/QuizBuilder";

export const Route = createFileRoute("/_authenticated/course-builder/$courseId")({
  head: () => ({
    meta: [
      { title: "Course builder — Vermaak Academy" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Builder,
});

type Tab = "settings" | "curriculum" | "quizzes";

function Builder() {
  const { courseId } = Route.useParams();
  const { isAdmin, loading } = useAuth();
  const [course, setCourse] = useState<any | null>(null);
  const [fetching, setFetching] = useState(true);
  const [tab, setTab] = useState<Tab>("settings");

  async function load() {
    const { data } = await supabase.from("courses").select("*").eq("id", courseId).maybeSingle();
    setCourse(data ?? null);
    setFetching(false);
  }

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, courseId]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 grid place-items-center px-4">
          <div className="text-center max-w-md">
            <ShieldAlert className="h-10 w-10 mx-auto text-destructive mb-3" />
            <h1 className="text-2xl font-bold mb-2">403 — Not authorised</h1>
            <p className="text-muted-foreground">You need an administrator account to build courses.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "settings", label: "Settings & pricing" },
    { id: "curriculum", label: "Curriculum" },
    { id: "quizzes", label: "Assessments" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>

          {fetching ? (
            <div className="py-20 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : !course ? (
            <p className="text-muted-foreground">Course not found.</p>
          ) : (
            <>
              <h1 className="text-3xl font-bold mb-1">{course.title}</h1>
              <p className="text-muted-foreground mb-6 text-sm">
                {course.archived_at ? "Hidden" : course.published ? "Published" : "Draft"} · {course.course_type?.replace("_", "-")} · {course.category}
              </p>


              <div className="flex flex-wrap gap-2 mb-6">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`px-4 h-10 rounded-full text-sm font-medium border transition ${
                      tab === t.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-7">
                {tab === "settings" && <CourseSettings course={course} onSaved={load} />}
                {tab === "curriculum" && <CurriculumEditor courseId={course.id} />}
                {tab === "quizzes" && <QuizBuilder courseId={course.id} />}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
