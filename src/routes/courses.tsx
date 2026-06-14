import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, LayoutGrid, List, X, Star, Clock, BarChart3, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CourseCard, type CourseCardData } from "@/components/CourseCard";
import { EnrollForm } from "@/components/EnrollForm";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "Courses — Vermaak Academy" },
      { name: "description", content: "Browse premium creative-tech courses across design, code, AI, marketing and more." },
      { property: "og:title", content: "Vermaak Academy Courses" },
      { property: "og:description", content: "Find the course that levels you up." },
    ],
  }),
  component: Courses,
});

type Module = { title: string; description?: string };
type CourseRow = CourseCardData & {
  featured: boolean;
  pinned?: boolean;
  full_description?: string | null;
  prerequisites?: string | null;
  certificate?: string | null;
  price?: string | null;
  what_you_learn?: string[] | null;
  modules?: Module[] | null;
};

const levels = ["All", "Beginner", "Intermediate", "Advanced"] as const;
const sorts = ["Featured", "Top Rated", "Shortest"] as const;

function Courses() {
  const [data, setData] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [level, setLevel] = useState<(typeof levels)[number]>("All");
  const [sort, setSort] = useState<(typeof sorts)[number]>("Featured");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [active, setActive] = useState<CourseRow | null>(null);
  const [enrollFor, setEnrollFor] = useState<CourseRow | null>(null);

  useEffect(() => {
    supabase
      .from("courses")
      .select("id,title,description,thumbnail_url,instructor,duration,category,level,rating,featured,pinned,full_description,prerequisites,certificate,price,what_you_learn,modules")
      .eq("published", true)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setData(data as CourseRow[]);
        setLoading(false);
      });
  }, []);

  const categories = useMemo(() => Array.from(new Set(data.map((c) => c.category))).sort(), [data]);

  const list = useMemo(() => {
    let r = data.filter((c) => {
      if (cat !== "All" && c.category !== cat) return false;
      if (level !== "All" && c.level !== level) return false;
      if (q && !`${c.title} ${c.description} ${c.instructor}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    if (sort === "Top Rated") r = [...r].sort((a, b) => b.rating - a.rating);
    if (sort === "Shortest") r = [...r].sort((a, b) => parseInt(a.duration) - parseInt(b.duration));
    if (sort === "Featured") r = [...r].sort((a, b) => {
      const pin = Number(!!b.pinned) - Number(!!a.pinned);
      if (pin !== 0) return pin;
      return Number(!!b.featured) - Number(!!a.featured);
    });
    return r;
  }, [data, q, cat, level, sort]);

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="relative pt-36 pb-12 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,oklch(0.74_0.13_230/0.2),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-5 lg:px-8 text-center">
          <p className="text-sm font-semibold text-[var(--ocean)] uppercase tracking-wider mb-2">Course Library</p>
          <h1 className="font-display font-extrabold text-5xl sm:text-6xl leading-tight">
            Find your <span className="gradient-text">next skill</span>.
          </h1>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            {loading ? "Loading courses…" : `${data.length} expert-led courses across creative-tech, design, code and entrepreneurship.`}
          </p>

          <div className="mt-8 max-w-2xl mx-auto relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search courses, instructors, topics…"
              className="w-full h-14 pl-14 pr-5 rounded-full bg-card border border-border/60 soft-shadow focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]"
            />
          </div>
        </div>
      </section>

      <section className="py-8 border-y border-border/60 bg-secondary/30 sticky top-16 z-30 glass">
        <div className="mx-auto max-w-7xl px-5 lg:px-8 flex flex-wrap gap-3 items-center">
          <div className="flex gap-2 overflow-x-auto pb-1 flex-1 min-w-0">
            {["All", ...categories].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium border transition ${
                  cat === c ? "gradient-brand text-white border-transparent" : "bg-background border-border/60 hover:border-[var(--cyan)]/50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <select value={level} onChange={(e) => setLevel(e.target.value as any)} className="h-9 px-3 rounded-full text-xs bg-background border border-border/60">
            {levels.map((l) => <option key={l}>{l}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="h-9 px-3 rounded-full text-xs bg-background border border-border/60">
            {sorts.map((s) => <option key={s}>{s}</option>)}
          </select>
          <div className="flex items-center gap-1 rounded-full bg-background border border-border/60 p-1">
            <button onClick={() => setView("grid")} aria-label="Grid view" className={`h-7 w-7 rounded-full flex items-center justify-center ${view === "grid" ? "bg-secondary" : ""}`}><LayoutGrid className="h-3.5 w-3.5" /></button>
            <button onClick={() => setView("list")} aria-label="List view" className={`h-7 w-7 rounded-full flex items-center justify-center ${view === "list" ? "bg-secondary" : ""}`}><List className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-[var(--cyan)]" /></div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-6">{list.length} {list.length === 1 ? "course" : "courses"}</p>
              {list.length === 0 ? (
                <div className="text-center py-24 rounded-3xl bg-card border border-border/60">
                  <p className="font-display font-bold text-xl">No courses match those filters</p>
                  <p className="text-muted-foreground mt-2">Try clearing a filter or searching for something else.</p>
                  <Button className="mt-6" variant="outline" onClick={() => { setQ(""); setCat("All"); setLevel("All"); }}>Reset filters</Button>
                </div>
              ) : view === "grid" ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {list.map((c) => <CourseCard key={c.id} course={c} onClick={() => setActive(c)} />)}
                </div>
              ) : (
                <div className="space-y-4">
                  {list.map((c) => (
                    <button key={c.id} onClick={() => setActive(c)} className="w-full flex gap-5 p-4 rounded-2xl bg-card border border-border/60 hover:border-[var(--cyan)]/50 transition text-left">
                      {c.thumbnail_url && <img src={c.thumbnail_url} alt="" className="h-28 w-44 rounded-xl object-cover shrink-0" loading="lazy" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <span className="font-semibold text-[var(--ocean)]">{c.category}</span> · <span>{c.level}</span>
                        </div>
                        <h3 className="font-display font-bold text-lg">{c.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{c.description}</p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{c.duration}</span>
                          <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-[var(--cyan)] text-[var(--cyan)]" />{c.rating}</span>
                          <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" />{c.instructor}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setActive(null)}>
          <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card border border-border/60 soft-shadow">
            <button onClick={() => setActive(null)} aria-label="Close" className="absolute top-4 right-4 z-10 h-9 w-9 rounded-full glass flex items-center justify-center"><X className="h-4 w-4" /></button>
            {active.thumbnail_url && <img src={active.thumbnail_url} alt="" className="w-full aspect-[2/1] object-cover" />}
            <div className="p-7">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 flex-wrap">
                <span className="font-semibold text-[var(--ocean)] uppercase tracking-wider">{active.category}</span> · <span>{active.level}</span> · <span>{active.duration}</span>
                {active.price && <span>· <strong className="text-foreground">{active.price}</strong></span>}
              </div>
              <h2 className="font-display font-extrabold text-3xl mb-2">{active.title}</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{active.full_description?.trim() || active.description}</p>

              {(active.prerequisites || active.certificate) && (
                <div className="mt-5 grid sm:grid-cols-2 gap-4 text-sm">
                  {active.prerequisites && (
                    <div className="p-4 rounded-xl bg-secondary/40">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Prerequisites</p>
                      <p>{active.prerequisites}</p>
                    </div>
                  )}
                  {active.certificate && (
                    <div className="p-4 rounded-xl bg-secondary/40">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Certificate</p>
                      <p>{active.certificate}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 grid sm:grid-cols-2 gap-5">
                <div>
                  <h3 className="font-display font-bold mb-2">What you'll learn</h3>
                  <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
                    {(active.what_you_learn && active.what_you_learn.length > 0
                      ? active.what_you_learn
                      : [
                          "Foundational concepts and modern best practices",
                          "Real project work shipped to your portfolio",
                          "Industry workflows used by top studios",
                          "Mentor feedback and peer reviews",
                        ]
                    ).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-display font-bold mb-2">Curriculum modules</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    {(active.modules && active.modules.length > 0
                      ? active.modules
                      : [
                          { title: "Foundations" },
                          { title: "Core craft" },
                          { title: "Advanced techniques" },
                          { title: "Capstone project" },
                        ]
                    ).map((m, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-[var(--cyan)] font-semibold shrink-0">{String(i + 1).padStart(2, "0")}.</span>
                        <div>
                          <p className="text-foreground font-medium">{m.title}</p>
                          {m.description && <p className="text-xs mt-0.5">{m.description}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border/60 flex items-center justify-end">
                <Button size="lg" variant="brand" onClick={() => { setEnrollFor(active); setActive(null); }}>Enroll Now</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <EnrollForm open={!!enrollFor} onClose={() => setEnrollFor(null)} course={enrollFor ? { id: enrollFor.id, title: enrollFor.title } : null} />

      <Footer />
    </main>
  );
}
