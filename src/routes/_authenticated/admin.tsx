import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, X, Upload, Loader2, ShieldAlert, Mail, Users, GraduationCap, Handshake, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Vermaak Academy" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: Admin,
});

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
};

type Subscriber = { id: string; email: string; name: string; created_at: string };
type Partner = { id: string; name: string; organization: string; email: string; phone: string; partnership_type: string; message: string; status: string; created_at: string };
type Enrollment = { id: string; course_title: string; name: string; email: string; phone: string; motivation: string; status: string; created_at: string };

const emptyForm: Omit<CourseRow, "id"> = {
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

  const [enrollQ, setEnrollQ] = useState("");
  const [enrollStatus, setEnrollStatusFilter] = useState("all");
  const [enrollPage, setEnrollPage] = useState(1);

  const [partnerQ, setPartnerQ] = useState("");
  const [partnerStatusFilter, setPartnerStatusFilter] = useState("all");
  const [partnerPage, setPartnerPage] = useState(1);

  const [subQ, setSubQ] = useState("");
  const [subPage, setSubPage] = useState(1);

  async function refresh() {
    const [{ data: c }, { data: s }, { data: p }, { data: e }] = await Promise.all([
      supabase.from("courses").select("*").order("created_at", { ascending: false }),
      supabase.from("newsletter_subscribers").select("id,email,name,created_at").order("created_at", { ascending: false }),
      supabase.from("partner_inquiries").select("*").order("created_at", { ascending: false }),
      supabase.from("course_enrollments").select("id,course_title,name,email,phone,motivation,status,created_at").order("created_at", { ascending: false }),
    ]);
    setCourses((c as CourseRow[]) ?? []);
    setSubs(s ?? []);
    setPartners((p as Partner[]) ?? []);
    setEnrollments((e as Enrollment[]) ?? []);
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
    const { id: _id, ...rest } = c;
    setForm(rest);
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
      if (editing) {
        const { error } = await supabase.from("courses").update(form).eq("id", editing.id);
        if (error) throw error;
        toast.success("Course updated");
      } else {
        const { error } = await supabase.from("courses").insert(form);
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
    return courses.filter((c) => {
      if (courseCat !== "all" && c.category !== courseCat) return false;
      if (courseLevel !== "all" && c.level !== courseLevel) return false;
      if (!q) return true;
      return [c.title, c.description, c.instructor, c.category].some((v) => (v ?? "").toLowerCase().includes(q));
    });
  }, [courses, courseQ, courseCat, courseLevel]);
  const pagedCourses = filteredCourses.slice((coursePage - 1) * PAGE_SIZE, coursePage * PAGE_SIZE);

  const filteredEnrollments = useMemo(() => {
    const q = enrollQ.toLowerCase().trim();
    return enrollments.filter((e) => {
      if (enrollStatus !== "all" && e.status !== enrollStatus) return false;
      if (!q) return true;
      return [e.name, e.email, e.course_title, e.phone, e.motivation].some((v) => (v ?? "").toLowerCase().includes(q));
    });
  }, [enrollments, enrollQ, enrollStatus]);
  const pagedEnrollments = filteredEnrollments.slice((enrollPage - 1) * PAGE_SIZE, enrollPage * PAGE_SIZE);

  const filteredPartners = useMemo(() => {
    const q = partnerQ.toLowerCase().trim();
    return partners.filter((p) => {
      if (partnerStatusFilter !== "all" && p.status !== partnerStatusFilter) return false;
      if (!q) return true;
      return [p.name, p.email, p.organization, p.partnership_type, p.message].some((v) => (v ?? "").toLowerCase().includes(q));
    });
  }, [partners, partnerQ, partnerStatusFilter]);
  const pagedPartners = filteredPartners.slice((partnerPage - 1) * PAGE_SIZE, partnerPage * PAGE_SIZE);

  const filteredSubs = useMemo(() => {
    const q = subQ.toLowerCase().trim();
    if (!q) return subs;
    return subs.filter((s) => [s.email, s.name].some((v) => (v ?? "").toLowerCase().includes(q)));
  }, [subs, subQ]);
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
                  <Button variant="brand" size="sm" onClick={startCreate}><Plus className="h-4 w-4 mr-1" /> New</Button>
                </SearchBar>

                <div className="space-y-3">
                  {pagedCourses.map((c) => (
                    <div key={c.id} className="flex gap-4 p-4 rounded-2xl bg-card border border-border/60">
                      {c.thumbnail_url ? (
                        <img src={c.thumbnail_url} alt="" className="h-20 w-32 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="h-20 w-32 rounded-lg bg-secondary shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span className="font-semibold text-[var(--ocean)]">{c.category}</span> · {c.level} · {c.duration}
                          {c.featured && <span className="px-2 rounded-full bg-[var(--cyan)]/15 text-[var(--ocean)]">Featured</span>}
                          {!c.published && <span className="px-2 rounded-full bg-destructive/15 text-destructive">Draft</span>}
                        </div>
                        <h3 className="font-display font-bold truncate">{c.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{c.description}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
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

                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Published</label>
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
                        </div>
                        {p.message && <p className="text-sm mt-3 max-w-2xl">{p.message}</p>}
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
              <SearchBar value={subQ} onChange={setSubQ} placeholder="Search by email or name…" />
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
