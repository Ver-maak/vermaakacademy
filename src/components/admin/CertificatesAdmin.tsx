import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Award, Search, ShieldOff, RotateCcw, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type CertRow = {
  id: string;
  certificate_number: string;
  learner_name: string;
  course_title: string;
  final_score: number;
  issued_at: string;
  status: "valid" | "revoked" | "reissued";
  revoked_reason: string;
  user_id: string;
};

const PAGE_SIZE = 10;

export function CertificatesAdmin() {
  const [rows, setRows] = useState<CertRow[]>([]);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "valid" | "revoked">("all");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data, error } = await supabase
      .from("certificates")
      .select("id,certificate_number,learner_name,course_title,final_score,issued_at,status,revoked_reason,user_id")
      .order("issued_at", { ascending: false });
    setLoading(false);
    if (error) return toast.error(error.message);
    const list = (data ?? []) as CertRow[];
    setRows(list);
    const ids = [...new Set(list.map((r) => r.user_id))];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id,email").in("id", ids);
      const map: Record<string, string> = {};
      (profs ?? []).forEach((p: { id: string; email: string | null }) => {
        if (p.email) map[p.id] = p.email;
      });
      setEmails(map);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function revoke(row: CertRow) {
    const reason = window.prompt(`Revoke ${row.certificate_number}?\n\nReason (shown to verifiers is only the revoked status):`, row.revoked_reason || "");
    if (reason === null) return;
    setBusyId(row.id);
    const { error } = await supabase
      .from("certificates")
      .update({ status: "revoked", revoked_reason: reason.trim() })
      .eq("id", row.id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success("Certificate revoked");
    load();
  }

  async function reinstate(row: CertRow) {
    setBusyId(row.id);
    const { error } = await supabase
      .from("certificates")
      .update({ status: "valid", revoked_reason: "" })
      .eq("id", row.id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success("Certificate reinstated");
    load();
  }

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!needle) return true;
      return (
        r.certificate_number.toLowerCase().includes(needle) ||
        r.learner_name.toLowerCase().includes(needle) ||
        r.course_title.toLowerCase().includes(needle) ||
        (emails[r.user_id] ?? "").toLowerCase().includes(needle)
      );
    });
  }, [rows, q, status, emails]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [q, status]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by number, learner, email or course…"
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-background border border-border"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="h-10 px-3 rounded-lg bg-background border border-border text-sm"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="valid">Valid</option>
          <option value="revoked">Revoked</option>
        </select>
        <a
          href="/verify"
          target="_blank"
          rel="noreferrer"
          className="h-10 px-4 inline-flex items-center gap-2 rounded-lg border border-border text-sm hover:bg-secondary"
        >
          <ExternalLink className="h-4 w-4" /> Public verify page
        </a>
      </div>

      <div className="rounded-2xl bg-card border border-border/60 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left">
            <tr>
              <th className="p-3">Certificate</th>
              <th className="p-3">Learner</th>
              <th className="p-3">Course</th>
              <th className="p-3">Score</th>
              <th className="p-3">Issued</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {paged.map((r) => (
              <tr key={r.id} className="border-t border-border/60 align-top">
                <td className="p-3 font-mono text-xs">{r.certificate_number}</td>
                <td className="p-3">
                  <div className="font-medium">{r.learner_name}</div>
                  <div className="text-xs text-muted-foreground">{emails[r.user_id] ?? "—"}</div>
                </td>
                <td className="p-3 text-muted-foreground">{r.course_title}</td>
                <td className="p-3">{r.final_score}%</td>
                <td className="p-3 text-muted-foreground whitespace-nowrap">{new Date(r.issued_at).toLocaleDateString()}</td>
                <td className="p-3">
                  {r.status === "revoked" ? (
                    <div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-destructive/15 text-destructive">Revoked</span>
                      {r.revoked_reason && <div className="text-xs text-muted-foreground mt-1 max-w-[16rem]">{r.revoked_reason}</div>}
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      {r.status === "reissued" ? "Reissued" : "Valid"}
                    </span>
                  )}
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  {r.status === "revoked" ? (
                    <button
                      onClick={() => reinstate(r)}
                      disabled={busyId === r.id}
                      className="inline-flex items-center gap-1 text-xs hover:underline disabled:opacity-50"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Reinstate
                    </button>
                  ) : (
                    <button
                      onClick={() => revoke(r)}
                      disabled={busyId === r.id}
                      className="inline-flex items-center gap-1 text-xs text-destructive hover:underline disabled:opacity-50"
                    >
                      <ShieldOff className="h-3.5 w-3.5" /> Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-muted-foreground">
                  <Award className="h-6 w-6 mx-auto mb-2 opacity-60" />
                  No certificates {rows.length ? "match your filters" : "issued yet"}.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-muted-foreground">Loading certificates…</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-5 text-sm">
          <span className="text-muted-foreground">Page {page} of {pages} · {filtered.length} total</span>
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
      )}
    </div>
  );
}
