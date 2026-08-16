import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2, Upload, FileText, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Module = { id: string; title: string; description: string; position: number };
type Lesson = {
  id: string;
  module_id: string;
  title: string;
  kind: "video" | "text" | "audio" | "embed";
  body: string;
  media_path: string | null;
  media_url: string | null;
  duration_minutes: number;
  position: number;
  is_required: boolean;
};
type Resource = { id: string; lesson_id: string; title: string; url: string | null; file_path: string | null };

const inputCls = "w-full h-10 px-3 rounded-lg bg-background border border-border text-sm";
const labelCls = "text-xs font-semibold text-muted-foreground uppercase tracking-wide";

export function CurriculumEditor({ courseId }: { courseId: string }) {
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newModule, setNewModule] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);

  async function refresh() {
    const [{ data: m }, { data: l }, { data: r }] = await Promise.all([
      supabase.from("course_modules").select("id,title,description,position").eq("course_id", courseId).is("archived_at", null).order("position"),
      supabase.from("lessons").select("id,module_id,title,kind,body,media_path,media_url,duration_minutes,position,is_required").eq("course_id", courseId).is("archived_at", null).order("position"),
      supabase.from("lesson_resources").select("id,lesson_id,title,url,file_path"),
    ]);
    setModules((m as Module[]) ?? []);
    setLessons((l as Lesson[]) ?? []);
    setResources((r as Resource[]) ?? []);
  }

  useEffect(() => {
    refresh();
  }, [courseId]);

  async function addModule() {
    const title = newModule.trim();
    if (!title) return toast.error("Module title required");
    setBusy(true);
    const { error } = await supabase.from("course_modules").insert({ course_id: courseId, title, position: modules.length + 1 } as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    setNewModule("");
    toast.success("Module added");
    refresh();
  }

  async function saveModule(m: Module) {
    const { error } = await supabase.from("course_modules").update({ title: m.title, description: m.description } as any).eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success("Module saved");
  }

  async function moveModule(m: Module, dir: -1 | 1) {
    const sorted = [...modules].sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex((x) => x.id === m.id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    await Promise.all([
      supabase.from("course_modules").update({ position: swap.position } as any).eq("id", m.id),
      supabase.from("course_modules").update({ position: m.position } as any).eq("id", swap.id),
    ]);
    refresh();
  }

  async function deleteModule(m: Module) {
    if (!confirm(`Archive module "${m.title}" and its lessons?`)) return;
    const now = new Date().toISOString();
    await supabase.from("lessons").update({ archived_at: now } as any).eq("module_id", m.id);
    const { error } = await supabase.from("course_modules").update({ archived_at: now } as any).eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success("Module archived");
    refresh();
  }

  async function addLesson(moduleId: string) {
    const count = lessons.filter((l) => l.module_id === moduleId).length;
    const { error } = await supabase.from("lessons").insert({
      course_id: courseId,
      module_id: moduleId,
      title: `Lesson ${count + 1}`,
      kind: "video",
      position: count + 1,
    } as any);
    if (error) return toast.error(error.message);
    refresh();
  }

  async function saveLesson(l: Lesson) {
    const { error } = await supabase
      .from("lessons")
      .update({
        title: l.title,
        kind: l.kind,
        body: l.body ?? "",
        media_url: l.media_url || null,
        duration_minutes: Number(l.duration_minutes) || 0,
        is_required: l.is_required,
      } as any)
      .eq("id", l.id);
    if (error) return toast.error(error.message);
    toast.success("Lesson saved");
  }

  async function moveLesson(l: Lesson, dir: -1 | 1) {
    const sibs = lessons.filter((x) => x.module_id === l.module_id).sort((a, b) => a.position - b.position);
    const idx = sibs.findIndex((x) => x.id === l.id);
    const swap = sibs[idx + dir];
    if (!swap) return;
    await Promise.all([
      supabase.from("lessons").update({ position: swap.position } as any).eq("id", l.id),
      supabase.from("lessons").update({ position: l.position } as any).eq("id", swap.id),
    ]);
    refresh();
  }

  async function deleteLesson(l: Lesson) {
    if (!confirm(`Archive lesson "${l.title}"?`)) return;
    const { error } = await supabase.from("lessons").update({ archived_at: new Date().toISOString() } as any).eq("id", l.id);
    if (error) return toast.error(error.message);
    refresh();
  }

  async function uploadMedia(l: Lesson, file: File) {
    setUploading(l.id);
    try {
      const ext = file.name.split(".").pop() ?? "mp4";
      const path = `${courseId}/${l.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("lesson-media").upload(path, file);
      if (error) throw error;
      const { error: upErr } = await supabase.from("lessons").update({ media_path: path } as any).eq("id", l.id);
      if (upErr) throw upErr;
      toast.success("Media uploaded");
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  async function addResourceUrl(lessonId: string, title: string, url: string) {
    if (!title.trim() || !url.trim()) return toast.error("Title and link required");
    const { error } = await supabase.from("lesson_resources").insert({ lesson_id: lessonId, title: title.trim(), url: url.trim() } as any);
    if (error) return toast.error(error.message);
    toast.success("Resource added");
    refresh();
  }

  async function uploadResource(lessonId: string, file: File) {
    setUploading(lessonId + "-res");
    try {
      const path = `${courseId}/${lessonId}/${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabase.storage.from("lesson-resources").upload(path, file);
      if (error) throw error;
      const { error: insErr } = await supabase
        .from("lesson_resources")
        .insert({ lesson_id: lessonId, title: file.name, file_path: path, size_bytes: file.size } as any);
      if (insErr) throw insErr;
      toast.success("Resource uploaded");
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  async function deleteResource(id: string) {
    const { error } = await supabase.from("lesson_resources").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <input className={inputCls} placeholder="New module title" value={newModule} onChange={(e) => setNewModule(e.target.value)} />
        <Button onClick={addModule} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />} Add module
        </Button>
      </div>

      {modules.length === 0 && <p className="text-sm text-muted-foreground">No modules yet. Add your first module above.</p>}

      {modules.map((m, mi) => {
        const mLessons = lessons.filter((l) => l.module_id === m.id).sort((a, b) => a.position - b.position);
        const expanded = open === m.id;
        return (
          <div key={m.id} className="rounded-xl border border-border/60 overflow-hidden">
            <div className="flex items-center gap-2 p-3 bg-secondary/40">
              <button onClick={() => setOpen(expanded ? null : m.id)} className="flex-1 text-left font-semibold text-sm">
                {mi + 1}. {m.title} <span className="text-muted-foreground font-normal">· {mLessons.length} lesson(s)</span>
              </button>
              <button onClick={() => moveModule(m, -1)} className="p-1.5 rounded hover:bg-background" aria-label="Move module up"><ChevronUp className="h-4 w-4" /></button>
              <button onClick={() => moveModule(m, 1)} className="p-1.5 rounded hover:bg-background" aria-label="Move module down"><ChevronDown className="h-4 w-4" /></button>
              <button onClick={() => deleteModule(m)} className="p-1.5 rounded hover:bg-background text-destructive" aria-label="Archive module"><Trash2 className="h-4 w-4" /></button>
            </div>

            {expanded && (
              <div className="p-4 space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Module title</label>
                    <input className={inputCls} value={m.title} onChange={(e) => setModules(modules.map((x) => (x.id === m.id ? { ...x, title: e.target.value } : x)))} />
                  </div>
                  <div>
                    <label className={labelCls}>Description</label>
                    <input className={inputCls} value={m.description ?? ""} onChange={(e) => setModules(modules.map((x) => (x.id === m.id ? { ...x, description: e.target.value } : x)))} />
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => saveModule(m)}><Save className="h-4 w-4 mr-1" /> Save module</Button>

                <div className="space-y-3">
                  {mLessons.map((l, li) => {
                    const lOpen = openLesson === l.id;
                    const lRes = resources.filter((r) => r.lesson_id === l.id);
                    return (
                      <div key={l.id} className="rounded-lg border border-border/60">
                        <div className="flex items-center gap-2 p-2.5">
                          <button onClick={() => setOpenLesson(lOpen ? null : l.id)} className="flex-1 text-left text-sm">
                            {mi + 1}.{li + 1} {l.title} <span className="text-muted-foreground">· {l.kind}</span>
                          </button>
                          <button onClick={() => moveLesson(l, -1)} className="p-1.5 rounded hover:bg-secondary" aria-label="Move lesson up"><ChevronUp className="h-4 w-4" /></button>
                          <button onClick={() => moveLesson(l, 1)} className="p-1.5 rounded hover:bg-secondary" aria-label="Move lesson down"><ChevronDown className="h-4 w-4" /></button>
                          <button onClick={() => deleteLesson(l)} className="p-1.5 rounded hover:bg-secondary text-destructive" aria-label="Archive lesson"><Trash2 className="h-4 w-4" /></button>
                        </div>
                        {lOpen && (
                          <div className="p-3 pt-0 space-y-3">
                            <div className="grid sm:grid-cols-3 gap-3">
                              <div className="sm:col-span-2">
                                <label className={labelCls}>Title</label>
                                <input className={inputCls} value={l.title} onChange={(e) => setLessons(lessons.map((x) => (x.id === l.id ? { ...x, title: e.target.value } : x)))} />
                              </div>
                              <div>
                                <label className={labelCls}>Type</label>
                                <select className={inputCls} value={l.kind} onChange={(e) => setLessons(lessons.map((x) => (x.id === l.id ? { ...x, kind: e.target.value as Lesson["kind"] } : x)))}>
                                  <option value="video">Video</option>
                                  <option value="text">Text</option>
                                  <option value="audio">Audio</option>
                                  <option value="embed">Embed</option>
                                </select>
                              </div>
                              <div>
                                <label className={labelCls}>Duration (min)</label>
                                <input type="number" min={0} className={inputCls} value={l.duration_minutes} onChange={(e) => setLessons(lessons.map((x) => (x.id === l.id ? { ...x, duration_minutes: Number(e.target.value) } : x)))} />
                              </div>
                              <div className="sm:col-span-2">
                                <label className={labelCls}>Video / embed URL (YouTube, Vimeo…)</label>
                                <input className={inputCls} value={l.media_url ?? ""} placeholder="https://youtube.com/watch?v=…" onChange={(e) => setLessons(lessons.map((x) => (x.id === l.id ? { ...x, media_url: e.target.value } : x)))} />
                              </div>
                            </div>

                            <div>
                              <label className={labelCls}>Lesson content / notes</label>
                              <textarea rows={4} className="w-full p-3 rounded-lg bg-background border border-border text-sm" value={l.body ?? ""} onChange={(e) => setLessons(lessons.map((x) => (x.id === l.id ? { ...x, body: e.target.value } : x)))} />
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                              <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={l.is_required} onChange={(e) => setLessons(lessons.map((x) => (x.id === l.id ? { ...x, is_required: e.target.checked } : x)))} /> Required for completion
                              </label>
                              <label className="inline-flex items-center gap-2 text-sm cursor-pointer px-3 h-9 rounded-lg border border-border hover:bg-secondary">
                                {uploading === l.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload media file
                                <input type="file" accept="video/*,audio/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadMedia(l, e.target.files[0])} />
                              </label>
                              {l.media_path && <span className="text-xs text-muted-foreground truncate max-w-[220px]">Uploaded: {l.media_path.split("/").pop()}</span>}
                              <Button size="sm" onClick={() => saveLesson(l)}><Save className="h-4 w-4 mr-1" /> Save lesson</Button>
                            </div>

                            <div className="rounded-lg border border-border/50 p-3 space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resources</p>
                              {lRes.map((r) => (
                                <div key={r.id} className="flex items-center gap-2 text-sm">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <span className="flex-1 truncate">{r.title}</span>
                                  <button onClick={() => deleteResource(r.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
                                </div>
                              ))}
                              <ResourceAdder lessonId={l.id} onAdd={addResourceUrl} onUpload={uploadResource} uploading={uploading === l.id + "-res"} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <Button size="sm" variant="outline" onClick={() => addLesson(m.id)}><Plus className="h-4 w-4 mr-1" /> Add lesson</Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ResourceAdder({
  lessonId,
  onAdd,
  onUpload,
  uploading,
}: {
  lessonId: string;
  onAdd: (lessonId: string, title: string, url: string) => void;
  onUpload: (lessonId: string, file: File) => void;
  uploading: boolean;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <input className={inputCls} placeholder="Resource title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input className={inputCls} placeholder="https://link-to-file" value={url} onChange={(e) => setUrl(e.target.value)} />
      <Button size="sm" variant="outline" onClick={() => { onAdd(lessonId, title, url); setTitle(""); setUrl(""); }}>Add link</Button>
      <label className="inline-flex items-center gap-2 text-sm cursor-pointer px-3 h-9 rounded-lg border border-border hover:bg-secondary whitespace-nowrap">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
        <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(lessonId, e.target.files[0])} />
      </label>
    </div>
  );
}
