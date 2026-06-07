"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";
import { Pencil, Trash2, Save, X, AlertTriangle, Flame, ArrowDown, Minus } from "lucide-react";
import { fmtDateTime } from "@/lib/utils";
import { JOB_PRIORITIES } from "@/lib/enums";
import { JobAttachments } from "@/components/jobs/job-attachments";
import { PriorityBadge } from "@/components/jobs/priority-badge";

const TRANSITIONS: Record<string, string[]> = {
  NEW:               ["CONFIRMED", "CANCELLED"],
  CONFIRMED:         ["DESIGN", "CANCELLED"],
  DESIGN:            ["WAITING_MATERIAL", "PRODUCTION", "CANCELLED"],
  WAITING_MATERIAL:  ["PRODUCTION", "CANCELLED"],
  PRODUCTION:        ["QC", "CANCELLED"],
  QC:                ["REWORK", "READY_TO_INSTALL", "DELIVERED"],
  REWORK:            ["PRODUCTION", "QC"],
  READY_TO_INSTALL:  ["INSTALLING", "DELIVERED"],
  INSTALLING:        ["DELIVERED", "COMPLETED"],
  DELIVERED:         ["COMPLETED"],
  COMPLETED:         [],
  CANCELLED:         []
};

interface JobDTO {
  id: string; code: string; status: string; priority: string;
  team: string | null; dueDate: string | null;
  productionNote: string | null; installNote: string | null; internalNote: string | null;
  customerOk: boolean;
  customer: { id: string; name: string; code: string; phone: string | null };
  quotation: {
    id: string; code: string; total: number; currency: string;
    itemCount: number; signTypes: string[];
  } | null;
  assignee: { id: string; name: string } | null;
  history: { id: string; from: string | null; to: string; by: string; at: string; note: string | null }[];
}

export function JobDetail({ job }: { job: JobDTO }) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [next, setNext] = useState(TRANSITIONS[job.status]?.[0] ?? "");
  const [note, setNote] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [team, setTeam] = useState(job.team ?? "");
  const [dueDate, setDueDate] = useState(job.dueDate?.slice(0, 10) ?? "");
  const [priority, setPriority] = useState(job.priority);
  const [productionNote, setProductionNote] = useState(job.productionNote ?? "");
  const [installNote, setInstallNote] = useState(job.installNote ?? "");
  const [internalNote, setInternalNote] = useState(job.internalNote ?? "");

  async function changeStatus() {
    if (!next) return;
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}/status`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, note })
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
      setNote("");
      router.refresh();
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function saveMeta() {
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team, dueDate: dueDate || null, priority, productionNote, installNote, internalNote })
      });
      if (!res.ok) throw new Error("Save failed");
      setEditMode(false);
      router.refresh();
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function deleteJob() {
    if (!confirm(`Delete job ${job.code}? This cannot be undone.`)) return;
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error ?? "Delete failed"); }
      router.push("/jobs");
    } catch (e: any) { setErr(e.message); setBusy(false); }
  }

  function cancelEdit() {
    setTeam(job.team ?? "");
    setDueDate(job.dueDate?.slice(0, 10) ?? "");
    setPriority(job.priority);
    setProductionNote(job.productionNote ?? "");
    setInstallNote(job.installNote ?? "");
    setInternalNote(job.internalNote ?? "");
    setEditMode(false);
  }

  return (
    <div>
      <PageHeader
        title={`${t("job.title")} ${job.code}`}
        subtitle={job.customer.name}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "/dashboard" },
          { label: t("job.title"), href: "/jobs" },
          { label: job.code }
        ]}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <PriorityBadge priority={job.priority} />
            <StatusBadge status={job.status} label={t(`job.status.${job.status}`)} className="text-sm py-1 px-3" />
            {!editMode ? (
              <>
                <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
                  <Pencil className="h-4 w-4" /> {t("common.edit")}
                </Button>
                <Button size="sm" variant="destructive" onClick={deleteJob} disabled={busy}>
                  <Trash2 className="h-4 w-4" /> {t("common.delete")}
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" onClick={saveMeta} disabled={busy}>
                  <Save className="h-4 w-4" /> {t("common.save")}
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit} disabled={busy}>
                  <X className="h-4 w-4" /> {t("common.cancel")}
                </Button>
              </>
            )}
          </div>
        }
      />

      {err && <p className="text-rose-600 text-sm mb-3">{err}</p>}

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Details</CardTitle>
            {editMode && <span className="text-xs text-cyan-600 font-medium">● Editing</span>}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>{t("job.team")}</Label>
                <Input value={team} onChange={(e) => setTeam(e.target.value)} placeholder="Production A / Install Team 1" disabled={!editMode} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("job.dueDate")}</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={!editMode} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("job.priority")}</Label>
                <Select value={priority} onChange={(e) => setPriority(e.target.value)} disabled={!editMode}>
                  {JOB_PRIORITIES.map((p) => <option key={p} value={p}>{t(`job.priorities.${p}`)}</option>)}
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>{t("job.productionNote")}</Label><Textarea value={productionNote} onChange={(e) => setProductionNote(e.target.value)} disabled={!editMode} /></div>
            <div className="space-y-1.5"><Label>{t("job.installNote")}</Label><Textarea value={installNote} onChange={(e) => setInstallNote(e.target.value)} disabled={!editMode} /></div>
            <div className="space-y-1.5"><Label>{t("job.internalNote")}</Label><Textarea value={internalNote} onChange={(e) => setInternalNote(e.target.value)} disabled={!editMode} /></div>
            {!editMode && (
              <p className="text-xs text-muted-foreground italic">
                Click <strong>{t("common.edit")}</strong> button above to modify these fields.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Status change</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Next status</Label>
              <Select value={next} onChange={(e) => setNext(e.target.value)}>
                <option value="">—</option>
                {(TRANSITIONS[job.status] ?? []).map((s) => (
                  <option key={s} value={s}>{t(`job.status.${s}`)}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Note</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <Button className="w-full" disabled={!next || busy} onClick={changeStatus}>Update</Button>
            {job.quotation && (
              <div className="text-xs text-muted-foreground pt-3 border-t">
                Linked quotation: <Link href={`/quotations/${job.quotation.id}`} className="text-primary">{job.quotation.code}</Link>
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Customer: <Link href={`/customers/${job.customer.id}`} className="text-primary">{job.customer.name}</Link>
              {job.customer.phone && <span> • {job.customer.phone}</span>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <JobAttachments jobId={job.id} />
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle>History</CardTitle></CardHeader>
        <CardContent>
          <ol className="relative border-l ml-3 space-y-4">
            {job.history.map((h) => (
              <li key={h.id} className="ml-4">
                <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary" />
                <div className="flex items-center gap-2 flex-wrap">
                  {h.from && <StatusBadge status={h.from} label={t(`job.status.${h.from}`)} className="text-[10px]" />}
                  <span className="text-muted-foreground text-xs">→</span>
                  <StatusBadge status={h.to} label={t(`job.status.${h.to}`)} className="text-[10px]" />
                </div>
                <div className="text-xs text-muted-foreground mt-1">{h.by} • {fmtDateTime(h.at)}</div>
                {h.note && <p className="text-sm mt-1 italic">{h.note}</p>}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
