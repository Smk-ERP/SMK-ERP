"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { fmtDate } from "@/lib/utils";
import { AlertCircle, Calendar } from "lucide-react";

interface JobCard {
  id: string; code: string; status: string; team: string | null;
  customer: string; assignee: string | null; dueDate: string | null;
}

const COLUMNS = ["DESIGN", "WAITING_MATERIAL", "PRODUCTION", "QC", "REWORK", "READY_TO_INSTALL"];
const COL_BG: Record<string, string> = {
  DESIGN: "bg-cyan-600/20 border-cyan-400",
  WAITING_MATERIAL: "bg-amber-600/30 border-amber-400",
  PRODUCTION: "bg-cyan-700/30 border-cyan-300",
  QC: "bg-amber-700/30 border-amber-300",
  REWORK: "bg-rose-700/40 border-rose-400",
  READY_TO_INSTALL: "bg-emerald-700/30 border-emerald-400"
};

export function TvView({ jobs }: { jobs: JobCard[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [clock, setClock] = useState<string>("");

  // Auto-refresh data every 30s
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30000);
    return () => clearInterval(id);
  }, [router]);

  // Clock — only on client to avoid hydration mismatch
  useEffect(() => {
    const upd = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      setClock(`${hh}:${mm}`);
    };
    upd();
    const id = setInterval(upd, 30000);
    return () => clearInterval(id);
  }, []);

  const lateCount = jobs.filter((j) => j.dueDate && new Date(j.dueDate) < new Date()).length;

  return (
    <div className="tv-view min-h-screen bg-brand-navyDeep text-slate-100 p-6">
      <header className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl brand-gradient flex items-center justify-center text-white font-black text-2xl">S</div>
          <div>
            <h1 className="text-3xl font-extrabold">{t("brand.name")}</h1>
            <p className="text-base text-slate-400">{t("production.title")}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold tracking-wider">{clock || "—"}</div>
          <div className="text-sm text-slate-400 mt-1">
            {jobs.length} active jobs • <span className={lateCount > 0 ? "text-rose-400 font-semibold" : ""}>{lateCount} late</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {COLUMNS.map((status) => {
          const colJobs = jobs.filter((j) => j.status === status);
          return (
            <div key={status} className={`rounded-lg border-l-4 p-3 ${COL_BG[status] ?? "bg-slate-800/30 border-slate-600"}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-base uppercase tracking-wide">{t(`job.status.${status}`)}</h3>
                <span className="text-sm font-bold bg-white/20 rounded-full px-2 py-0.5">{colJobs.length}</span>
              </div>
              <div className="space-y-2">
                {colJobs.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">—</p>
                ) : (
                  colJobs.map((j) => {
                    const isLate = j.dueDate && new Date(j.dueDate) < new Date();
                    return (
                      <div key={j.id} className={`bg-white/10 backdrop-blur rounded-md p-2 ${isLate ? "ring-2 ring-rose-500" : ""}`}>
                        <div className="flex items-center gap-1 justify-between">
                          <span className="font-mono text-xs text-cyan-300">{j.code}</span>
                          {isLate && <AlertCircle className="h-4 w-4 text-rose-400" />}
                        </div>
                        <div className="font-semibold text-sm mt-0.5 leading-snug line-clamp-2">{j.customer}</div>
                        {j.dueDate && (
                          <div className={`text-xs mt-1 flex items-center gap-1 ${isLate ? "text-rose-300 font-semibold" : "text-slate-300"}`}>
                            <Calendar className="h-3 w-3" />{fmtDate(j.dueDate)}
                          </div>
                        )}
                        {j.assignee && <div className="text-[10px] text-slate-400 mt-1 truncate">{j.assignee}</div>}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-500 mt-6">Auto-refresh every 30s</p>
    </div>
  );
}
