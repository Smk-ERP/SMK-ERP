"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { useI18n } from "@/lib/i18n/context";
import { DEFAULT_CHECKLIST_TEMPLATE } from "@/lib/qc";
import { CheckCircle2, XCircle } from "lucide-react";

interface Job { id: string; code: string; customer: string; status: string }
interface CheckLine { key: string; label: string; pass: boolean; note?: string }

export function QCForm({ jobs, initialJobId }: { jobs: Job[]; initialJobId?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [jobId, setJobId] = useState(initialJobId ?? jobs[0]?.id ?? "");
  const [lines, setLines] = useState<CheckLine[]>(
    DEFAULT_CHECKLIST_TEMPLATE.map((it) => ({ key: it.key, label: it.label, pass: true, note: "" }))
  );
  const [overallNote, setOverallNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function toggle(idx: number, pass: boolean) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, pass } : l)));
  }

  function updateNote(idx: number, note: string) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, note } : l)));
  }

  const allPass = lines.every((l) => l.pass);
  const result: "PASS" | "FAIL" = allPass ? "PASS" : "FAIL";

  async function submit() {
    setBusy(true); setErr(null);
    try {
      if (!jobId) throw new Error("Pick a job");
      const items = lines.map((l) => ({ ...l, label: t(l.label) })); // resolve i18n at submit
      const res = await fetch("/api/qc", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, items, result, note: overallNote })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Failed");
      router.push(`/jobs/${jobId}`);
    } catch (e: any) { setErr(e.message); setBusy(false); }
  }

  return (
    <div>
      <PageHeader
        title={t("qc.newCheck")}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "/dashboard" },
          { label: t("qc.title"), href: "/qc" },
          { label: t("qc.newCheck") }
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>{t("qc.checklist")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t("materialRequest.job")}</Label>
              <Select value={jobId} onChange={(e) => setJobId(e.target.value)}>
                <option value="">—</option>
                {jobs.map((j) => <option key={j.id} value={j.id}>{j.code} — {j.customer} [{j.status}]</option>)}
              </Select>
            </div>

            <div className="border-t pt-4 space-y-3">
              {lines.map((l, i) => (
                <div key={l.key} className={`rounded-lg border p-3 ${l.pass ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="font-medium">{t(l.label)}</div>
                    <div className="flex gap-1">
                      <Button size="sm" variant={l.pass ? "default" : "outline"} onClick={() => toggle(i, true)}>
                        <CheckCircle2 className="h-4 w-4" /> {t("qc.pass")}
                      </Button>
                      <Button size="sm" variant={!l.pass ? "destructive" : "outline"} onClick={() => toggle(i, false)}>
                        <XCircle className="h-4 w-4" /> {t("qc.fail")}
                      </Button>
                    </div>
                  </div>
                  {!l.pass && (
                    <Input
                      placeholder="What went wrong?"
                      value={l.note ?? ""}
                      onChange={(e) => updateNote(i, e.target.value)}
                      className="bg-white"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-1.5 pt-3 border-t">
              <Label>Note</Label>
              <Textarea value={overallNote} onChange={(e) => setOverallNote(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("qc.result")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className={`rounded-xl p-6 text-center ${allPass ? "bg-emerald-100" : "bg-rose-100"}`}>
              <div className={`text-4xl font-bold ${allPass ? "text-emerald-700" : "text-rose-700"}`}>
                {allPass ? t("qc.pass") : t("qc.fail")}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {allPass
                  ? "Job will move to READY_TO_INSTALL"
                  : `${lines.filter(l => !l.pass).length} item(s) failed → Rework task created, job → REWORK`}
              </p>
            </div>
            {err && <p className="text-rose-600 text-sm">{err}</p>}
            <Button className="w-full" disabled={busy || !jobId} onClick={submit} size="lg">
              {busy ? t("common.loading") : t("common.submit")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
