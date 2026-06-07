"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PriorityBadge } from "@/components/jobs/priority-badge";
import { useI18n } from "@/lib/i18n/context";
import { fmtDate } from "@/lib/utils";
import { formatMoney, type CurrencyCode } from "@/lib/currency";
import {
  Tv, AlertCircle, User, Calendar, Package, FileText,
  CheckCircle2, XCircle, FileWarning
} from "lucide-react";

interface JobCard {
  id: string; code: string; status: string; priority: string; team: string | null;
  customer: string; assignee: string | null; dueDate: string | null;
  productionNote: string | null;
  signTypes: string[]; itemCount: number;
  quotationCode: string | null; quotationTotal: number; currency: string;
  pendingMR: number; lastQC: string | null;
  thumbUrl: string | null; thumbIsImage: boolean;
}

const COLUMNS: { status: string; tone: string; bar: string }[] = [
  { status: "NEW",              tone: "bg-slate-100",  bar: "border-l-slate-400" },
  { status: "CONFIRMED",        tone: "bg-blue-50",    bar: "border-l-blue-400" },
  { status: "DESIGN",           tone: "bg-cyan-50",    bar: "border-l-cyan-400" },
  { status: "WAITING_MATERIAL", tone: "bg-amber-50",   bar: "border-l-amber-400" },
  { status: "PRODUCTION",       tone: "bg-cyan-100",   bar: "border-l-cyan-500" },
  { status: "QC",               tone: "bg-amber-100",  bar: "border-l-amber-500" },
  { status: "REWORK",           tone: "bg-rose-100",   bar: "border-l-rose-500" },
  { status: "READY_TO_INSTALL", tone: "bg-emerald-50", bar: "border-l-emerald-500" }
];

const PRIORITY_ORDER: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export function ProductionBoard({ jobs: initialJobs }: { jobs: JobCard[] }) {
  const { t } = useI18n();
  const router = useRouter();

  const [jobs, setJobs] = useState(initialJobs);
  const [team, setTeam] = useState("");
  const [priorityF, setPriorityF] = useState("");
  const [search, setSearch] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const teams = useMemo(() => Array.from(new Set(jobs.map((j) => j.team).filter(Boolean) as string[])), [jobs]);

  const filtered = useMemo(() => {
    const sl = search.toLowerCase();
    return jobs
      .filter((j) => {
        if (team && j.team !== team) return false;
        if (priorityF && j.priority !== priorityF) return false;
        if (!sl) return true;
        return j.code.toLowerCase().includes(sl) || j.customer.toLowerCase().includes(sl);
      })
      .sort((a, b) => {
        const ap = PRIORITY_ORDER[a.priority] ?? 9;
        const bp = PRIORITY_ORDER[b.priority] ?? 9;
        if (ap !== bp) return ap - bp;
        const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return ad - bd;
      });
  }, [jobs, team, priorityF, search]);

  async function moveJob(jobId: string, newStatus: string) {
    const job = jobs.find((j) => j.id === jobId);
    if (!job || job.status === newStatus) return;

    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j)));
    setBusy(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/status`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, note: "Moved via Kanban" })
      });
      if (!res.ok) {
        setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: job.status } : j)));
        const j = await res.json();
        alert(j.error ?? "Failed to update status");
      }
    } catch (e: any) {
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: job.status } : j)));
      alert(e.message);
    } finally {
      setBusy(false);
      router.refresh();
    }
  }

  const urgent = jobs.filter((j) => j.priority === "URGENT").length;
  const late = jobs.filter((j) => j.dueDate && new Date(j.dueDate) < new Date()).length;

  return (
    <div>
      <PageHeader
        title={t("production.title")}
        subtitle={`${jobs.length} active • ${urgent} urgent • ${late} late`}
        breadcrumb={[{ label: t("nav.dashboard"), href: "/dashboard" }, { label: t("production.title") }]}
        action={
          <Button asChild variant="outline">
            <Link href="/production/tv" target="_blank"><Tv className="h-4 w-4" /> {t("production.tvView")}</Link>
          </Button>
        }
      />

      <Card className="p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input className="flex-1" placeholder={t("common.search")} value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={team} onChange={(e) => setTeam(e.target.value)} className="sm:max-w-[180px]">
            <option value="">{t("production.filterTeam")}</option>
            {teams.map((tt) => <option key={tt} value={tt}>{tt}</option>)}
          </Select>
          <Select value={priorityF} onChange={(e) => setPriorityF(e.target.value)} className="sm:max-w-[180px]">
            <option value="">{t("job.priority")}</option>
            {["URGENT", "HIGH", "MEDIUM", "LOW"].map((p) => <option key={p} value={p}>{t(`job.priorities.${p}`)}</option>)}
          </Select>
        </div>
      </Card>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {COLUMNS.map((col) => {
            const colJobs = filtered.filter((j) => j.status === col.status);
            const colUrgent = colJobs.filter((j) => j.priority === "URGENT").length;
            return (
              <div
                key={col.status}
                className={`w-80 shrink-0 rounded-lg ${col.tone} p-2`}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain") || dragId;
                  if (id) moveJob(id, col.status);
                  setDragId(null);
                }}
              >
                <div className="px-2 pt-1 pb-3 flex items-center justify-between">
                  <h3 className="font-bold text-sm uppercase tracking-wide text-slate-700">
                    {t(`job.status.${col.status}`)}
                  </h3>
                  <div className="flex gap-1">
                    {colUrgent > 0 && <span className="text-xs font-bold bg-rose-500 text-white rounded-full px-2 py-0.5">{colUrgent} ⚡</span>}
                    <span className="text-xs font-semibold bg-white rounded-full px-2 py-0.5 text-slate-600">{colJobs.length}</span>
                  </div>
                </div>

                <div className="space-y-2 min-h-[200px]">
                  {colJobs.length === 0 ? (
                    <div className="text-xs text-slate-400 text-center py-8">{t("production.noJobs")}</div>
                  ) : (
                    colJobs.map((j) => {
                      const isLate = j.dueDate && new Date(j.dueDate) < new Date();
                      const isUrgent = j.priority === "URGENT";
                      return (
                        <div
                          key={j.id}
                          draggable={!busy}
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", j.id);
                            e.dataTransfer.effectAllowed = "move";
                            setDragId(j.id);
                          }}
                          onDragEnd={() => setDragId(null)}
                          className={`bg-white rounded-md shadow-sm border-l-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${col.bar} ${isUrgent ? "ring-2 ring-rose-400" : ""} ${dragId === j.id ? "opacity-50" : ""}`}
                        >
                          {j.thumbIsImage && j.thumbUrl && (
                            <img src={j.thumbUrl} alt="" className="w-full h-24 object-cover rounded-t-md" />
                          )}

                          <div className="p-2.5">
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <Link href={`/jobs/${j.id}`} className="font-mono text-xs text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                                {j.code}
                              </Link>
                              <PriorityBadge priority={j.priority} withLabel={false} />
                            </div>

                            <div className="text-sm font-semibold leading-tight line-clamp-1">{j.customer}</div>

                            {j.signTypes.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {j.signTypes.slice(0, 2).map((s) => (
                                  <span key={s} className="text-[10px] bg-cyan-50 text-cyan-700 rounded px-1.5 py-0.5 border border-cyan-100">
                                    {t(`signTypes.${s}`)}
                                  </span>
                                ))}
                                {j.signTypes.length > 2 && (
                                  <span className="text-[10px] text-muted-foreground">+{j.signTypes.length - 2}</span>
                                )}
                              </div>
                            )}

                            <div className="flex flex-col gap-1 text-xs text-slate-600 mt-2">
                              {j.assignee && <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{j.assignee}</span>}
                              {j.dueDate && (
                                <span className={`inline-flex items-center gap-1 ${isLate ? "text-rose-600 font-medium" : ""}`}>
                                  <Calendar className="h-3 w-3" />{fmtDate(j.dueDate)}
                                  {isLate && <AlertCircle className="h-3 w-3" />}
                                </span>
                              )}
                              {j.team && (
                                <span className="inline-flex items-center gap-1 text-slate-500">
                                  <Package className="h-3 w-3" />{j.team}
                                </span>
                              )}
                            </div>

                            {j.productionNote && (
                              <p className="text-[11px] text-slate-500 italic mt-2 line-clamp-2 bg-slate-50 rounded px-1.5 py-1">
                                {j.productionNote}
                              </p>
                            )}

                            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 text-[10px]">
                              {j.itemCount > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-slate-500">
                                  <FileText className="h-3 w-3" />{j.itemCount}
                                </span>
                              )}
                              {j.pendingMR > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-amber-700 bg-amber-50 rounded px-1 py-0.5 border border-amber-200" title="Pending material request(s)">
                                  <FileWarning className="h-3 w-3" />{j.pendingMR} MR
                                </span>
                              )}
                              {j.lastQC === "PASS" && (
                                <span className="inline-flex items-center gap-0.5 text-emerald-700"><CheckCircle2 className="h-3 w-3" />QC</span>
                              )}
                              {j.lastQC === "FAIL" && (
                                <span className="inline-flex items-center gap-0.5 text-rose-600"><XCircle className="h-3 w-3" />QC FAIL</span>
                              )}
                              <span className="ml-auto text-slate-400 font-medium">
                                {formatMoney(j.quotationTotal, j.currency as CurrencyCode, "en")}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        💡 Drag cards between columns to update job status. Cards sort by priority (URGENT → LOW) then due date.
      </p>
    </div>
  );
}
