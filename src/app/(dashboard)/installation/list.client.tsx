"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useI18n } from "@/lib/i18n/context";
import { fmtDate, fmtDateTime } from "@/lib/utils";
import { Calendar, Plus, Wrench } from "lucide-react";

interface Inst {
  id: string; status: string; scheduledAt: string | null; completedAt: string | null;
  job: { id: string; code: string; customer: string }; owner: string; note: string | null;
}
interface Ready { id: string; code: string; customer: string; dueDate: string | null }

const STATUS_BADGE: Record<string, string> = {
  SCHEDULED: "SENT", IN_PROGRESS: "INSTALLING", COMPLETED: "COMPLETED", CANCELLED: "CANCELLED"
};

export function InstallationList({ installations, readyJobs }: { installations: Inst[]; readyJobs: Ready[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [scheduleFor, setScheduleFor] = useState<string>("");
  const [scheduleAt, setScheduleAt] = useState<string>(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function schedule() {
    if (!scheduleFor) return;
    setBusy(true);
    try {
      const res = await fetch("/api/installations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: scheduleFor, scheduledAt: scheduleAt, note })
      });
      if (!res.ok) { const j = await res.json(); alert(j.error ?? "Failed"); return; }
      setScheduleFor(""); setNote("");
      router.refresh();
    } finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader
        title={t("installation.title")}
        breadcrumb={[{ label: t("nav.dashboard"), href: "/dashboard" }, { label: t("installation.title") }]}
      />

      {readyJobs.length > 0 && (
        <Card className="mb-4">
          <CardHeader><CardTitle><Calendar className="inline h-5 w-5 mr-2" />{t("installation.newSchedule")}</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1.5 sm:col-span-1">
              <Label>{t("materialRequest.job")}</Label>
              <Select value={scheduleFor} onChange={(e) => setScheduleFor(e.target.value)}>
                <option value="">Pick a READY_TO_INSTALL job…</option>
                {readyJobs.map((j) => <option key={j.id} value={j.id}>{j.code} — {j.customer}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("common.date")}</Label>
              <Input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Note</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="sm:col-span-3 flex justify-end">
              <Button disabled={!scheduleFor || busy} onClick={schedule}><Plus className="h-4 w-4" /> {t("installation.newSchedule")}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>{t("installation.schedule")}</CardTitle></CardHeader>
        <CardContent>
          {installations.length === 0 ? (
            <EmptyState title={t("common.noData")} description="Schedule an installation for a READY_TO_INSTALL job above." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>{t("job.code")}</TH>
                  <TH>{t("quotation.customer")}</TH>
                  <TH>{t("common.date")}</TH>
                  <TH>{t("installation.team")}</TH>
                  <TH>{t("common.status")}</TH>
                  <TH></TH>
                </TR>
              </THead>
              <TBody>
                {installations.map((i) => (
                  <TR key={i.id}>
                    <TD className="font-mono text-xs"><Link href={`/jobs/${i.job.id}`} className="text-primary">{i.job.code}</Link></TD>
                    <TD>{i.job.customer}</TD>
                    <TD className="text-xs">{i.scheduledAt ? fmtDateTime(i.scheduledAt) : "—"}</TD>
                    <TD className="text-xs">{i.owner}</TD>
                    <TD><StatusBadge status={STATUS_BADGE[i.status]} label={t(`installation.status.${i.status}`)} /></TD>
                    <TD className="text-right">
                      <Button asChild size="sm" variant="outline"><Link href={`/installation/${i.id}`}><Wrench className="h-4 w-4" />Open</Link></Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
