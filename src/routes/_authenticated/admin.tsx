import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, X, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Vermaak Academy" }] }),
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

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [subs, setSubs] = useState<{ id: string; email: string; name: string; created_at: string }[]>([]);
  const [editing, setEditing] = useState<CourseRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      toast.error("Admin access required.");
    }
  }, [loading, user, isAdmin]);

  async function refresh() {
    const [{ data: c }, { data: s }] = await Promise.all([
      supabase.from("courses").select("*").order("created_at", { ascending: false }),
      supabase.from("newsletter_subscribers").select("id,email,name,created_at").order("created_at", { ascending: false }),
    ]);
    setCourses((c as CourseRow[]) ?? []);
    setSubs(s ?? []);
  }

  useEffect(() => {
    if (isAdmin) refresh();
  }, [isAdmin]);

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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="pt-36 max-w-xl mx-auto px-5 text-center">
          <h1 className="font-display font-extrabold text-3xl">Admin only</h1>
          <p className="mt-3 text-muted-foreground">
            Your account ({user?.email}) does not have admin access. Ask an admin to grant you the role.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">User ID: <code>{user?.id}</code></p>
          <Button className="mt-6" variant="brand" onClick={() => navigate({ to: "/" })}>Back home</Button>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <section className="pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--ocean)] uppercase tracking-wider">Admin</p>
              <h1 className="font-display font-extrabold text-4xl">Course Management</h1>
            </div>
            <Button variant="brand" onClick={startCreate}><Plus className="h-4 w-4 mr-1" /> New course</Button>
          </div>

          <div className="grid lg:grid-cols-[1fr_380px] gap-8">
            <div className="space-y-3">
              {courses.map((c) => (
                <div key={c.id} className="flex gap-4 p-4 rounded-2xl bg-card border border-border/60">
                  {c.thumbnail_url ? (
                    <img src={c.thumbnail_url} alt="" className="h-20 w-32 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="h-20 w-32 rounded-lg bg-secondary shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
              {courses.length === 0 && <p className="text-muted-foreground">No courses yet.</p>}
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

          <div className="mt-16">
            <h2 className="font-display font-bold text-2xl mb-4">Newsletter subscribers ({subs.length})</h2>
            <div className="rounded-2xl bg-card border border-border/60 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary/40 text-left">
                  <tr><th className="p-3">Email</th><th className="p-3">Name</th><th className="p-3">Joined</th><th className="p-3"></th></tr>
                </thead>
                <tbody>
                  {subs.map((s) => (
                    <tr key={s.id} className="border-t border-border/60">
                      <td className="p-3">{s.email}</td>
                      <td className="p-3 text-muted-foreground">{s.name || "—"}</td>
                      <td className="p-3 text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                      <td className="p-3 text-right"><button onClick={() => removeSub(s.id)} className="text-destructive hover:underline text-xs">Remove</button></td>
                    </tr>
                  ))}
                  {subs.length === 0 && <tr><td className="p-6 text-center text-muted-foreground" colSpan={4}>No subscribers yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
