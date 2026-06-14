import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, X, Upload, Loader2, ShieldAlert, Mail, Users, GraduationCap, Handshake, Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, Pin, PinOff, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Vermaak Academy" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: Admin,
});

type Module = { title: string; description: string };

type CourseRow = {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  instructor: string;
  duration: string;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  rating: number;
  featured: boolean;
  published: boolean;
  pinned: boolean;
  pinned_at: string | null;
  full_description: string | null;
  prerequisites: string | null;
  certificate: string | null;
  price: string | null;
  what_you_learn: string[];
  modules: Module[];
  registration_start: string | null;
  registration_end: string | null;
};

type Subscriber = { id: string; email: string; name: string; created_at: string };
type Partner = { id: string; name: string; organization: string; email: string; phone: string; partnership_type: string; message: string; status: string; created_at: string; role?: string; website?: string; country?: string; city?: string; organization_size?: string; industry?: string; budget_range?: string; timeline?: string; goals?: string };
type Enrollment = { id: string; course_title: string; name: string; email: string; phone: string; motivation: string; status: string; created_at: string; country?: string; city?: string; age_range?: string; gender?: string; occupation?: string; education_level?: string; experience_level?: string; preferred_schedule?: string; heard_from?: string };

const emptyForm: Omit<CourseRow, "id" | "pinned_at"> = {
  title: "",
  description: "",
  thumbnail_url: "",
  instructor: "",
  duration: "",
  category: "Web Development",
  level: "Beginner",
  rating: 4.8,
  featured: false,
  published: true,
  pinned: false,
  full_description: "",
  prerequisites: "",
  certificate: "",
  price: "",
  what_you_learn: [],
  modules: [],
  registration_start: null,
  registration_end: null,
};

type Tab = "courses" | "enrollments" | "partners" | "subscribers";

const PAGE_SIZE = 8;

function Pager({ page, setPage, total }: { page: number; setPage: (n: number) => void; total: number }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (total <= PAGE_SIZE) return null;
  return (
    <div className="flex items-center justify-between mt-5 text-sm">
      <span className="text-muted-foreground">
        Page {page} of {pages} · {total} total
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="h-9 w-9 rounded-full border border-border/60 inline-flex items-center justify-center disabled:opacity-40 hover:bg-secondary"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => setPage(Math.min(pages, page + 1))}
          disabled={page >= pages}
          className="h-9 w-9 rounded-full border border-border/60 inline-flex items-center justify-center disabled:opacity-40 hover:bg-secondary"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function SearchBar({ value, onChange, placeholder, children }: { value: string; onChange: (v: string) => void; placeholder: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-10 pl-9 pr-3 rounded-lg bg-background border border-border"
        />
      </div>
      {children}
    </div>
  );
}

type SortDir = "asc" | "desc";
type SortOpt = { value: string; label: string };

function SortControl({
  options,
  sortBy,
  sortDir,
  onChange,
}: {
  options: SortOpt[];
  sortBy: string;
  sortDir: SortDir;
  onChange: (by: string, dir: SortDir) => void;
}) {
  const current = options.find((o) => o.value === sortBy);
  return (
    <div className="inline-flex items-stretch rounded-lg border border-border bg-background overflow-hidden">
      <div className="flex items-center pl-3 pr-1 text-xs text-muted-foreground gap-1">
        <ArrowUpDown className="h-3.5 w-3.5" /> Sort
      </div>
      <select
        value={sortBy}
        onChange={(e) => onChange(e.target.value, sortDir)}
        className="h-10 px-2 bg-background text-sm border-x border-border focus:outline-none"
        aria-label="Sort by"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onChange(sortBy, sortDir === "asc" ? "desc" : "asc")}
        className="px-3 inline-flex items-center gap-1 text-xs font-medium hover:bg-secondary"
        aria-label={`Sort direction: ${sortDir === "asc" ? "ascending" : "descending"}`}
        title={`${current?.label ?? ""} — ${sortDir === "asc" ? "Ascending" : "Descending"}`}
      >
        {sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
        {sortDir === "asc" ? "Asc" : "Desc"}
      </button>
    </div>
  );
}

function cmp(a: any, b: any): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return (a === b ? 0 : a ? 1 : -1);
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

function sortBy<T>(arr: T[], key: keyof T | ((row: T) => any), dir: SortDir): T[] {
  const get = typeof key === "function" ? (key as (r: T) => any) : (r: T) => r[key];
  const sorted = [...arr].sort((a, b) => cmp(get(a), get(b)));
  return dir === "asc" ? sorted : sorted.reverse();
}

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("courses");
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [editing, setEditing] = useState<CourseRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Search + filter state per tab
  const [courseQ, setCourseQ] = useState("");
  const [courseCat, setCourseCat] = useState("all");
  const [courseLevel, setCourseLevel] = useState("all");
  const [coursePage, setCoursePage] = useState(1);
  const [courseSort, setCourseSort] = useState<{ by: string; dir: SortDir }>({ by: "created_at", dir: "desc" });

  const [enrollQ, setEnrollQ] = useState("");
  const [enrollStatus, setEnrollStatusFilter] = useState("all");
  const [enrollPage, setEnrollPage] = useState(1);
  const [enrollSort, setEnrollSort] = useState<{ by: string; dir: SortDir }>({ by: "created_at", dir: "desc" });

  const [partnerQ, setPartnerQ] = useState("");
  const [partnerStatusFilter, setPartnerStatusFilter] = useState("all");
  const [partnerPage, setPartnerPage] = useState(1);
  const [partnerSort, setPartnerSort] = useState<{ by: string; dir: SortDir }>({ by: "created_at", dir: "desc" });

  const [subQ, setSubQ] = useState("");
  const [subPage, setSubPage] = useState(1);
  const [subSort, setSubSort] = useState<{ by: string; dir: SortDir }>({ by: "created_at", dir: "desc" });

  async function refresh() {
    const [{ data: c }, { data: s }, { data: p }, { data: e }] = await Promise.all([
      supabase.from("courses").select("*").order("pinned", { ascending: false }).order("pinned_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }),
      supabase.from("newsletter_subscribers").select("id,email,name,created_at").order("created_at", { ascending: false }),
      supabase.from("partner_inquiries").select("*").order("created_at", { ascending: false }),
      supabase.from("course_enrollments").select("*").order("created_at", { ascending: false }),
    ]);
    setCourses((c as unknown as CourseRow[]) ?? []);
    setSubs(s ?? []);
    setPartners((p as unknown as Partner[]) ?? []);
    setEnrollments((e as unknown as Enrollment[]) ?? []);
  }

  useEffect(() => {
    if (isAdmin) refresh();
  }, [isAdmin]);

  // Reset page when filters change
  useEffect(() => setCoursePage(1), [courseQ, courseCat, courseLevel]);
  useEffect(() => setEnrollPage(1), [enrollQ, enrollStatus]);
  useEffect(() => setPartnerPage(1), [partnerQ, partnerStatusFilter]);
  useEffect(() => setSubPage(1), [subQ]);

  function startCreate() {
    setEditing(null);
    setForm(emptyForm);
  }

  function startEdit(c: CourseRow) {
    setEditing(c);
    const { id: _id, pinned_at: _pa, ...rest } = c;
    setForm({
      ...rest,
      full_description: rest.full_description ?? "",
      prerequisites: rest.prerequisites ?? "",
      certificate: rest.certificate ?? "",
      price: rest.price ?? "",
      what_you_learn: Array.isArray(rest.what_you_learn) ? rest.what_you_learn : [],
      modules: Array.isArray(rest.modules) ? rest.modules : [],
      registration_start: rest.registration_start ?? null,
      registration_end: rest.registration_end ?? null,
    });
  }

  async function togglePin(c: CourseRow) {
    const next = !c.pinned;
    const { error } = await supabase
      .from("courses")
      .update({ pinned: next, pinned_at: next ? new Date().toISOString() : null })
      .eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success(next ? "Course pinned to top" : "Course unpinned");
    refresh();
  }

  async function togglePublished(c: CourseRow) {
    const next = !c.published;
    const { error } = await supabase.from("courses").update({ published: next }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success(next ? "Course published" : "Course unpublished");
    refresh();
  }

  async function uploadThumb(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("course-thumbnails").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = await supabase.storage.from("course-thumbnails").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (!data?.signedUrl) throw new Error("Failed to get URL");
      setForm((f) => ({ ...f, thumbnail_url: data.signedUrl }));
      toast.success("Thumbnail uploaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const normalized = {
        ...form,
        registration_start: form.registration_start ? form.registration_start : null,
        registration_end: form.registration_end ? form.registration_end : null,
      };
      if (editing) {
        const payload = { ...normalized, pinned_at: form.pinned ? (editing.pinned_at ?? new Date().toISOString()) : null };
        const { error } = await supabase.from("courses").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Course updated");
      } else {
        const payload = { ...normalized, pinned_at: form.pinned ? new Date().toISOString() : null };
        const { error } = await supabase.from("courses").insert(payload);
        if (error) throw error;
        toast.success("Course created");
      }
      setEditing(null);
      setForm(emptyForm);
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this course?")) return;
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Course deleted");
    refresh();
  }

  async function removeSub(id: string) {
    if (!confirm("Remove this subscriber?")) return;
    const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }

  const [newSubEmail, setNewSubEmail] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [addingSub, setAddingSub] = useState(false);
  async function addSubscriber(e: React.FormEvent) {
    e.preventDefault();
    const email = newSubEmail.trim();
    const name = newSubName.trim();
    if (!email) return toast.error("Email is required");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast.error("Invalid email");
    setAddingSub(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email, name });
    setAddingSub(false);
    if (error) {
      if (error.code === "23505") return toast.error("Already subscribed");
      return toast.error(error.message);
    }
    toast.success("Subscriber added");
    setNewSubEmail("");
    setNewSubName("");
    refresh();
  }

  async function setPartnerStatus(id: string, status: string) {
    const { error } = await supabase.from("partner_inquiries").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }
  async function removePartner(id: string) {
    if (!confirm("Delete this inquiry?")) return;
    const { error } = await supabase.from("partner_inquiries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }
  async function setEnrollStatusUpdate(id: string, status: string) {
    const { error } = await supabase.from("course_enrollments").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }
  async function removeEnroll(id: string) {
    if (!confirm("Delete this enrollment?")) return;
    const { error } = await supabase.from("course_enrollments").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }

  // Filtered + paginated views
  const courseCats = useMemo(() => Array.from(new Set(courses.map((c) => c.category).filter(Boolean))), [courses]);

  const filteredCourses = useMemo(() => {
    const q = courseQ.toLowerCase().trim();
    const filtered = courses.filter((c) => {
      if (courseCat !== "all" && c.category !== courseCat) return false;
      if (courseLevel !== "all" && c.level !== courseLevel) return false;
      if (!q) return true;
      return [c.title, c.description, c.instructor, c.category].some((v) => (v ?? "").toLowerCase().includes(q));
    });
    return sortBy(filtered, courseSort.by as keyof CourseRow, courseSort.dir);
  }, [courses, courseQ, courseCat, courseLevel, courseSort]);
  const pagedCourses = filteredCourses.slice((coursePage - 1) * PAGE_SIZE, coursePage * PAGE_SIZE);

  const filteredEnrollments = useMemo(() => {
    const q = enrollQ.toLowerCase().trim();
    const filtered = enrollments.filter((e) => {
      if (enrollStatus !== "all" && e.status !== enrollStatus) return false;
      if (!q) return true;
      return [e.name, e.email, e.course_title, e.phone, e.motivation].some((v) => (v ?? "").toLowerCase().includes(q));
    });
    return sortBy(filtered, enrollSort.by as keyof Enrollment, enrollSort.dir);
  }, [enrollments, enrollQ, enrollStatus, enrollSort]);
  const pagedEnrollments = filteredEnrollments.slice((enrollPage - 1) * PAGE_SIZE, enrollPage * PAGE_SIZE);

  const filteredPartners = useMemo(() => {
    const q = partnerQ.toLowerCase().trim();
    const filtered = partners.filter((p) => {
      if (partnerStatusFilter !== "all" && p.status !== partnerStatusFilter) return false;
      if (!q) return true;
      return [p.name, p.email, p.organization, p.partnership_type, p.message].some((v) => (v ?? "").toLowerCase().includes(q));
    });
    return sortBy(filtered, partnerSort.by as keyof Partner, partnerSort.dir);
  }, [partners, partnerQ, partnerStatusFilter, partnerSort]);
  const pagedPartners = filteredPartners.slice((partnerPage - 1) * PAGE_SIZE, partnerPage * PAGE_SIZE);

  const filteredSubs = useMemo(() => {
    const q = subQ.toLowerCase().trim();
    const filtered = q ? subs.filter((s) => [s.email, s.name].some((v) => (v ?? "").toLowerCase().includes(q))) : subs;
    return sortBy(filtered, subSort.by as keyof Subscriber, subSort.dir);
  }, [subs, subQ, subSort]);
  const pagedSubs = filteredSubs.slice((subPage - 1) * PAGE_SIZE, subPage * PAGE_SIZE);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="pt-36 max-w-xl mx-auto px-5 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/15 text-destructive mb-5">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="font-display font-extrabold text-3xl">403 — Admin access required</h1>
          <p className="mt-3 text-muted-foreground">
            Your account ({user?.email}) does not have admin privileges.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <Button variant="brand" onClick={() => navigate({ to: "/" })}>Back home</Button>
            <Button variant="outline" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}>Sign out</Button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const stats = [
    { label: "Courses", icon: GraduationCap, value: courses.length },
    { label: "Enrollments", icon: Users, value: enrollments.length },
    { label: "Partners", icon: Handshake, value: partners.length },
    { label: "Subscribers", icon: Mail, value: subs.length },
  ];

  const tabs: { id: Tab; label: string }[] = [
    { id: "courses", label: `Courses (${courses.length})` },
    { id: "enrollments", label: `Enrollments (${enrollments.length})` },
    { id: "partners", label: `Partners (${partners.length})` },
    { id: "subscribers", label: `Subscribers (${subs.length})` },
  ];

  const selectCls = "h-10 px-3 rounded-lg bg-background border border-border text-sm";

  return (
    <main className="min-h-screen">
      <Navbar />
      <section className="pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mb-8">
            <p className="text-sm font-semibold text-[var(--ocean)] uppercase tracking-wider">Admin Dashboard</p>
            <h1 className="font-display font-extrabold text-4xl">Welcome, {user?.email}</h1>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {stats.map((s) => (
              <div key={s.label} className="p-5 rounded-2xl bg-card border border-border/60 soft-shadow">
                <s.icon className="h-5 w-5 text-[var(--cyan)] mb-2" />
                <div className="font-display font-extrabold text-3xl">{s.value}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition ${
                  tab === t.id ? "gradient-brand text-white border-transparent" : "bg-background border-border/60 hover:border-[var(--cyan)]/50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "courses" && (
            <div className="grid lg:grid-cols-[1fr_380px] gap-8">
              <div>
                <SearchBar value={courseQ} onChange={setCourseQ} placeholder="Search by title, instructor, category…">
                  <select value={courseCat} onChange={(e) => setCourseCat(e.target.value)} className={selectCls}>
                    <option value="all">All categories</option>
                    {courseCats.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={courseLevel} onChange={(e) => setCourseLevel(e.target.value)} className={selectCls}>
                    <option value="all">All levels</option>
                    <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                  </select>
                  <SortControl
                    sortBy={courseSort.by}
                    sortDir={courseSort.dir}
                    onChange={(by, dir) => setCourseSort({ by, dir })}
                    options={[
                      { value: "created_at", label: "Newest" },
                      { value: "title", label: "Title" },
                      { value: "category", label: "Category" },
                      { value: "level", label: "Level" },
                      { value: "rating", label: "Rating" },
                    ]}
                  />
                  <Button variant="brand" size="sm" onClick={startCreate}><Plus className="h-4 w-4 mr-1" /> New</Button>
                </SearchBar>

                <div className="space-y-3">
                  {pagedCourses.map((c) => (
                    <div key={c.id} className={`flex gap-4 p-4 rounded-2xl bg-card border ${c.pinned ? "border-[var(--cyan)]/60 ring-1 ring-[var(--cyan)]/30" : "border-border/60"}`}>
                      {c.thumbnail_url ? (
                        <img src={c.thumbnail_url} alt="" className="h-20 w-32 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="h-20 w-32 rounded-lg bg-secondary shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span className="font-semibold text-[var(--ocean)]">{c.category}</span> · {c.level} · {c.duration}
                          {c.pinned && <span className="px-2 rounded-full bg-[var(--cyan)]/20 text-[var(--ocean)] inline-flex items-center gap-1"><Pin className="h-3 w-3" />Pinned</span>}
                          {c.featured && <span className="px-2 rounded-full bg-[var(--cyan)]/15 text-[var(--ocean)]">Featured</span>}
                          {!c.published && <span className="px-2 rounded-full bg-destructive/15 text-destructive">Draft</span>}
                        </div>
                        <h3 className="font-display font-bold truncate">{c.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{c.description}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => togglePin(c)}
                          title={c.pinned ? "Unpin from top" : "Pin to top"}
                          aria-label={c.pinned ? "Unpin course" : "Pin course"}
                          className={`h-9 w-9 rounded-full inline-flex items-center justify-center ${c.pinned ? "bg-[var(--cyan)]/15 text-[var(--ocean)] hover:bg-[var(--cyan)]/25" : "hover:bg-secondary"}`}
                        >
                          {c.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => togglePublished(c)}
                          title={c.published ? "Unpublish" : "Publish"}
                          aria-label={c.published ? "Unpublish course" : "Publish course"}
                          className={`h-9 w-9 rounded-full inline-flex items-center justify-center ${c.published ? "hover:bg-secondary" : "bg-destructive/10 text-destructive hover:bg-destructive/20"}`}
                        >
                          {c.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                        <button onClick={() => startEdit(c)} className="h-9 w-9 rounded-full hover:bg-secondary inline-flex items-center justify-center"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => remove(c.id)} className="h-9 w-9 rounded-full hover:bg-destructive/10 text-destructive inline-flex items-center justify-center"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                  {filteredCourses.length === 0 && <p className="text-muted-foreground py-8 text-center">No courses match.</p>}
                </div>
                <Pager page={coursePage} setPage={setCoursePage} total={filteredCourses.length} />
              </div>

              <form onSubmit={save} className="space-y-3 p-6 rounded-2xl bg-card border border-border/60 h-fit sticky top-24">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-display font-bold text-lg">{editing ? "Edit course" : "New course"}</h2>
                  {editing && <button type="button" onClick={startCreate} className="text-xs text-muted-foreground"><X className="h-4 w-4" /></button>}
                </div>

                <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full h-10 px-3 rounded-lg bg-background border border-border" />
                <textarea required placeholder="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full p-3 rounded-lg bg-background border border-border resize-none" />
                <input required placeholder="Instructor" value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} className="w-full h-10 px-3 rounded-lg bg-background border border-border" />
                <div className="grid grid-cols-2 gap-3">
                  <input required placeholder="Duration (e.g. 8 weeks)" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="h-10 px-3 rounded-lg bg-background border border-border" />
                  <input required placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="h-10 px-3 rounded-lg bg-background border border-border" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as any })} className="h-10 px-3 rounded-lg bg-background border border-border">
                    <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                  </select>
                  <input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: parseFloat(e.target.value) })} className="h-10 px-3 rounded-lg bg-background border border-border" />
                </div>

                <label className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-border cursor-pointer hover:bg-secondary/40">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span className="text-sm">{uploading ? "Uploading…" : "Upload thumbnail"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadThumb(e.target.files[0])} />
                </label>
                <input placeholder="…or paste image URL" value={form.thumbnail_url ?? ""} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} className="w-full h-10 px-3 rounded-lg bg-background border border-border text-xs" />
                {form.thumbnail_url && <img src={form.thumbnail_url} alt="" className="w-full aspect-[16/10] object-cover rounded-lg" />}

                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Published</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} /> Pinned to top</label>
                </div>

                <div className="pt-3 border-t border-border/60 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Extra details (shown on course modal)</p>
                  <input placeholder="Price (e.g. Free, $99, 350,000 UGX)" value={form.price ?? ""} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm" />
                  <textarea placeholder="Full description (longer, supports line breaks)" rows={4} value={form.full_description ?? ""} onChange={(e) => setForm({ ...form, full_description: e.target.value })} className="w-full p-3 rounded-lg bg-background border border-border resize-none text-sm" />
                  <input placeholder="Prerequisites" value={form.prerequisites ?? ""} onChange={(e) => setForm({ ...form, prerequisites: e.target.value })} className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm" />
                  <input placeholder="Certificate info (e.g. Certificate on completion)" value={form.certificate ?? ""} onChange={(e) => setForm({ ...form, certificate: e.target.value })} className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm" />

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Registration opens (optional)</label>
                      <input
                        type="date"
                        value={form.registration_start ? form.registration_start.slice(0, 10) : ""}
                        onChange={(e) => setForm({ ...form, registration_start: e.target.value || null })}
                        className="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Registration closes (optional)</label>
                      <input
                        type="date"
                        value={form.registration_end ? form.registration_end.slice(0, 10) : ""}
                        onChange={(e) => setForm({ ...form, registration_end: e.target.value || null })}
                        className="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border text-sm"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground -mt-1">Leave both empty for open registration.</p>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">What you'll learn</label>
                      <button type="button" onClick={() => setForm({ ...form, what_you_learn: [...form.what_you_learn, ""] })} className="text-xs inline-flex items-center gap-1 text-[var(--ocean)] hover:underline"><Plus className="h-3 w-3" /> Add</button>
                    </div>
                    <div className="space-y-2">
                      {form.what_you_learn.map((item, i) => (
                        <div key={i} className="flex gap-2">
                          <input value={item} onChange={(e) => {
                            const arr = [...form.what_you_learn]; arr[i] = e.target.value; setForm({ ...form, what_you_learn: arr });
                          }} placeholder={`Outcome ${i + 1}`} className="flex-1 h-9 px-3 rounded-lg bg-background border border-border text-sm" />
                          <button type="button" onClick={() => setForm({ ...form, what_you_learn: form.what_you_learn.filter((_, j) => j !== i) })} className="h-9 w-9 rounded-lg hover:bg-destructive/10 text-destructive inline-flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      ))}
                      {form.what_you_learn.length === 0 && <p className="text-xs text-muted-foreground">No outcomes yet.</p>}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Curriculum modules</label>
                      <button type="button" onClick={() => setForm({ ...form, modules: [...form.modules, { title: "", description: "" }] })} className="text-xs inline-flex items-center gap-1 text-[var(--ocean)] hover:underline"><Plus className="h-3 w-3" /> Add module</button>
                    </div>
                    <div className="space-y-2">
                      {form.modules.map((m, i) => (
                        <div key={i} className="p-3 rounded-lg border border-border space-y-2">
                          <div className="flex gap-2 items-center">
                            <span className="text-xs text-muted-foreground w-8">{String(i + 1).padStart(2, "0")}</span>
                            <input value={m.title} onChange={(e) => {
                              const arr = [...form.modules]; arr[i] = { ...arr[i], title: e.target.value }; setForm({ ...form, modules: arr });
                            }} placeholder="Module title" className="flex-1 h-9 px-3 rounded-lg bg-background border border-border text-sm" />
                            <button type="button" onClick={() => setForm({ ...form, modules: form.modules.filter((_, j) => j !== i) })} className="h-9 w-9 rounded-lg hover:bg-destructive/10 text-destructive inline-flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                          <textarea value={m.description} onChange={(e) => {
                            const arr = [...form.modules]; arr[i] = { ...arr[i], description: e.target.value }; setForm({ ...form, modules: arr });
                          }} placeholder="What this module covers (optional)" rows={2} className="w-full p-2 rounded-lg bg-background border border-border text-xs resize-none" />
                        </div>
                      ))}
                      {form.modules.length === 0 && <p className="text-xs text-muted-foreground">No modules yet.</p>}
                    </div>
                  </div>
                </div>

                <Button type="submit" variant="brand" className="w-full" disabled={busy}>
                  {busy ? "Saving…" : editing ? "Save changes" : "Create course"}
                </Button>
              </form>
            </div>
          )}

          {tab === "enrollments" && (
            <div>
              <SearchBar value={enrollQ} onChange={setEnrollQ} placeholder="Search by name, email, course…">
                <select value={enrollStatus} onChange={(e) => setEnrollStatusFilter(e.target.value)} className={selectCls}>
                  <option value="all">All statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="enrolled">Enrolled</option>
                  <option value="rejected">Rejected</option>
                </select>
                <SortControl
                  sortBy={enrollSort.by}
                  sortDir={enrollSort.dir}
                  onChange={(by, dir) => setEnrollSort({ by, dir })}
                  options={[
                    { value: "created_at", label: "Date received" },
                    { value: "name", label: "Name" },
                    { value: "course_title", label: "Course" },
                    { value: "status", label: "Status" },
                  ]}
                />
              </SearchBar>
              <div className="space-y-3">
                {pagedEnrollments.map((e) => (
                  <div key={e.id} className="p-5 rounded-2xl bg-card border border-border/60">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0">
                        <div className="text-xs text-[var(--ocean)] font-semibold uppercase tracking-wider">{e.course_title}</div>
                        <h3 className="font-display font-bold mt-1">{e.name}</h3>
                        <div className="text-sm text-muted-foreground mt-1">
                          <a href={`mailto:${e.email}`} className="hover:text-foreground">{e.email}</a>
                          {e.phone && <> · {e.phone}</>}
                        </div>
                        {(e.country || e.city || e.age_range || e.gender || e.occupation || e.education_level || e.experience_level || e.preferred_schedule || e.heard_from) && (
                          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                            {[
                              [e.city, e.country].filter(Boolean).join(", "),
                              e.age_range, e.gender, e.occupation, e.education_level,
                              e.experience_level && `Exp: ${e.experience_level}`,
                              e.preferred_schedule, e.heard_from && `Heard via: ${e.heard_from}`,
                            ].filter(Boolean).map((t, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{t}</span>
                            ))}
                          </div>
                        )}
                        {e.motivation && <p className="text-sm mt-3 max-w-2xl">{e.motivation}</p>}
                        <p className="text-xs text-muted-foreground mt-2">Received {new Date(e.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select value={e.status} onChange={(ev) => setEnrollStatusUpdate(e.id, ev.target.value)} className="h-9 px-2 text-xs rounded-lg bg-background border border-border">
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="enrolled">Enrolled</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <button onClick={() => removeEnroll(e.id)} className="h-9 w-9 rounded-full hover:bg-destructive/10 text-destructive inline-flex items-center justify-center"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredEnrollments.length === 0 && <p className="text-muted-foreground py-12 text-center">No enrollment requests match.</p>}
              </div>
              <Pager page={enrollPage} setPage={setEnrollPage} total={filteredEnrollments.length} />
            </div>
          )}

          {tab === "partners" && (
            <div>
              <SearchBar value={partnerQ} onChange={setPartnerQ} placeholder="Search by name, organization, email…">
                <select value={partnerStatusFilter} onChange={(e) => setPartnerStatusFilter(e.target.value)} className={selectCls}>
                  <option value="all">All statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="active">Active</option>
                  <option value="declined">Declined</option>
                </select>
                <SortControl
                  sortBy={partnerSort.by}
                  sortDir={partnerSort.dir}
                  onChange={(by, dir) => setPartnerSort({ by, dir })}
                  options={[
                    { value: "created_at", label: "Date received" },
                    { value: "name", label: "Contact name" },
                    { value: "organization", label: "Organization" },
                    { value: "partnership_type", label: "Type" },
                    { value: "status", label: "Status" },
                  ]}
                />
              </SearchBar>
              <div className="space-y-3">
                {pagedPartners.map((p) => (
                  <div key={p.id} className="p-5 rounded-2xl bg-card border border-border/60">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0">
                        <div className="text-xs text-[var(--ocean)] font-semibold uppercase tracking-wider">{p.partnership_type || "Partnership"}</div>
                        <h3 className="font-display font-bold mt-1">{p.name} {p.organization && <span className="font-normal text-muted-foreground">· {p.organization}</span>}</h3>
                        <div className="text-sm text-muted-foreground mt-1">
                          <a href={`mailto:${p.email}`} className="hover:text-foreground">{p.email}</a>
                          {p.phone && <> · {p.phone}</>}
                          {p.website && <> · <a href={p.website} target="_blank" rel="noopener noreferrer" className="hover:text-foreground underline">{p.website}</a></>}
                        </div>
                        {(p.role || p.city || p.country || p.industry || p.organization_size || p.budget_range || p.timeline) && (
                          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                            {[
                              p.role,
                              [p.city, p.country].filter(Boolean).join(", "),
                              p.industry,
                              p.organization_size && `${p.organization_size} people`,
                              p.budget_range && `Budget: ${p.budget_range}`,
                              p.timeline && `Timeline: ${p.timeline}`,
                            ].filter(Boolean).map((t, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{t}</span>
                            ))}
                          </div>
                        )}
                        {p.goals && <p className="text-sm mt-3 max-w-2xl"><span className="font-semibold">Goals:</span> {p.goals}</p>}
                        {p.message && <p className="text-sm mt-2 max-w-2xl">{p.message}</p>}
                        <p className="text-xs text-muted-foreground mt-2">Received {new Date(p.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select value={p.status} onChange={(ev) => setPartnerStatus(p.id, ev.target.value)} className="h-9 px-2 text-xs rounded-lg bg-background border border-border">
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="active">Active</option>
                          <option value="declined">Declined</option>
                        </select>
                        <button onClick={() => removePartner(p.id)} className="h-9 w-9 rounded-full hover:bg-destructive/10 text-destructive inline-flex items-center justify-center"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredPartners.length === 0 && <p className="text-muted-foreground py-12 text-center">No partner inquiries match.</p>}
              </div>
              <Pager page={partnerPage} setPage={setPartnerPage} total={filteredPartners.length} />
            </div>
          )}

          {tab === "subscribers" && (
            <div>
              <SearchBar value={subQ} onChange={setSubQ} placeholder="Search by email or name…">
                <SortControl
                  sortBy={subSort.by}
                  sortDir={subSort.dir}
                  onChange={(by, dir) => setSubSort({ by, dir })}
                  options={[
                    { value: "created_at", label: "Date joined" },
                    { value: "email", label: "Email" },
                    { value: "name", label: "Name" },
                  ]}
                />
              </SearchBar>
              <div className="rounded-2xl bg-card border border-border/60 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/40 text-left">
                    <tr><th className="p-3">Email</th><th className="p-3">Name</th><th className="p-3">Joined</th><th className="p-3"></th></tr>
                  </thead>
                  <tbody>
                    {pagedSubs.map((s) => (
                      <tr key={s.id} className="border-t border-border/60">
                        <td className="p-3">{s.email}</td>
                        <td className="p-3 text-muted-foreground">{s.name || "—"}</td>
                        <td className="p-3 text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                        <td className="p-3 text-right"><button onClick={() => removeSub(s.id)} className="text-destructive hover:underline text-xs">Remove</button></td>
                      </tr>
                    ))}
                    {filteredSubs.length === 0 && <tr><td className="p-6 text-center text-muted-foreground" colSpan={4}>No subscribers match.</td></tr>}
                  </tbody>
                </table>
              </div>
              <Pager page={subPage} setPage={setSubPage} total={filteredSubs.length} />
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
