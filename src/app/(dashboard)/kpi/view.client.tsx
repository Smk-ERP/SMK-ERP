"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney } from "@/lib/currency";
import { DEFAULT_TIERS, computeCommission } from "@/lib/incentive";
import { Trophy, TrendingUp, Plus } from "lucide-react";

interface Rec {
  id: string; userId: string; userName: string; role: string;
  kpiScore: number; kbiScore: number; totalScore: number;
  salesAmount: number; commission: number; note: string | null;
}
interface UserOpt { id: string; name: string; role: string }

export function KPIView({ period, records, users }: { period: string; records: Rec[]; users: UserOpt[] }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const search = useSearchParams();

  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId] = useState(users[0]?.id ?? "");
  const [kpi, setKpi] = useState(80);
  const [kbi, setKbi] = useState(80);
  const [sales, setSales] = useState(600_000_000);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const preview = computeCommission({ salesLak: sales, kpiScore: kpi, kbiScore: kbi });

  async function save() {
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/kpi", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, period, kpiScore: kpi, kbiScore: kbi, salesAmount: sales, note })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Save failed");
      setShowForm(false);
      router.refresh();
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  function setPeriod(p: string) {
    const sp = new URLSearchParams(search?.toString());
    sp.set("period", p);
    router.push(`/kpi?${sp.toString()}`);
  }

  const totalCommission = records.reduce((s, r) => s + r.commission, 0);
  const totalSales = records.reduce((s, r) => s + r.salesAmount, 0);

  return (
    <div>
      <PageHeader
        title={t("kpi.title")}
        subtitle={`${t("kpi.period")}: ${period}`}
        breadcrumb={[{ label: t("nav.dashboard"), href: "/dashboard" }, { label: t("kpi.title") }]}
        action={
          <div className="flex gap-2">
            <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="w-40" />
            <Button onClick={() => setShowForm((v) => !v)}>
              <Plus className="h-4 w-4" /> {t("kpi.newRecord")}
            </Button>
          </div>
        }
      />

      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <Card className="p-4 bg-cyan-50">
          <p className="text-xs text-cyan-700">{t("kpi.salesAmount")} ({period})</p>
          <p className="text-xl font-bold text-cyan-700">{formatMoney(totalSales, "LAK", locale)}</p>
        </Card>
        <Card className="p-4 bg-emerald-50">
          <p className="text-xs text-emerald-700">Total {t("kpi.commission")}</p>
          <p className="text-xl font-bold text-emerald-700">{formatMoney(totalCommission, "LAK", locale)}</p>
        </Card>
        <Card className="p-4 bg-amber-50">
          <p className="text-xs text-amber-700"># records</p>
          <p className="text-xl font-bold text-amber-700">{records.length}</p>
        </Card>
      </div>

      {/* Tier reference */}
      <Card className="mb-4">
        <CardHeader><CardTitle>Commission Tiers</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Tier</TH>
                <TH className="text-right">Min Sales (LAK)</TH>
                <TH className="text-right">Base %</TH>
                <TH className="text-right">Multiplier</TH>
              </TR>
            </THead>
            <TBody>
              {DEFAULT_TIERS.map((tt) => (
                <TR key={tt.label}>
                  <TD>{tt.label}</TD>
                  <TD className="text-right">{tt.minSalesLak.toLocaleString()}</TD>
                  <TD className="text-right">{tt.pct.toFixed(2)}%</TD>
                  <TD className="text-right">{tt.multiplier.toFixed(2)}×</TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <p className="text-xs text-muted-foreground mt-3">
            Final commission = (Sales × Tier%) × Tier multiplier × ({t("kpi.totalScore")} ÷ 100)
            <br />
            {t("kpi.totalScore")} = KPI × 0.7 + KBI × 0.3
          </p>
        </CardContent>
      </Card>

      {showForm && (
        <Card className="mb-4 border-cyan-400 border-2">
          <CardHeader><CardTitle>{t("kpi.newRecord")} — {period}</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Staff</Label>
              <Select value={userId} onChange={(e) => setUserId(e.target.value)}>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("kpi.salesAmount")} (LAK)</Label>
              <Input type="number" value={sales} onChange={(e) => setSales(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("kpi.kpiScore")} (0–100)</Label>
              <Input type="number" min={0} max={100} value={kpi} onChange={(e) => setKpi(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("kpi.kbiScore")} (0–100)</Label>
              <Input type="number" min={0} max={100} value={kbi} onChange={(e) => setKbi(Number(e.target.value))} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Note</Label>
              <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <div className="sm:col-span-3 grid sm:grid-cols-4 gap-2 bg-cyan-50 rounded-lg p-3 text-sm">
              <Stat label="Tier" value={preview.tier.label} />
              <Stat label={t("kpi.achievement")} value={`${preview.achievementPct}%`} />
              <Stat label={t("kpi.totalScore")} value={preview.totalScore.toFixed(1)} />
              <Stat label={t("kpi.commission")} value={formatMoney(preview.finalCommission, "LAK", locale)} accent />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2">
              {err && <p className="text-rose-600 text-sm mr-auto">{err}</p>}
              <Button variant="outline" onClick={() => setShowForm(false)}>{t("common.cancel")}</Button>
              <Button disabled={busy} onClick={save}>{busy ? t("common.loading") : t("common.save")}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle><Trophy className="inline h-5 w-5 mr-2 text-amber-500" />{t("kpi.leaderboard")}</CardTitle></CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No records for this period</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>#</TH>
                  <TH>Staff</TH>
                  <TH className="text-right">KPI (70%)</TH>
                  <TH className="text-right">KBI (30%)</TH>
                  <TH className="text-right">{t("kpi.totalScore")}</TH>
                  <TH className="text-right">{t("kpi.salesAmount")}</TH>
                  <TH className="text-right">{t("kpi.commission")}</TH>
                </TR>
              </THead>
              <TBody>
                {records.map((r, i) => (
                  <TR key={r.id}>
                    <TD>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</TD>
                    <TD>
                      <div className="font-medium">{r.userName}</div>
                      <div className="text-xs text-muted-foreground">{r.role}</div>
                    </TD>
                    <TD className="text-right">{r.kpiScore.toFixed(1)}</TD>
                    <TD className="text-right">{r.kbiScore.toFixed(1)}</TD>
                    <TD className="text-right font-bold text-cyan-700">{r.totalScore.toFixed(1)}</TD>
                    <TD className="text-right">{formatMoney(r.salesAmount, "LAK", locale)}</TD>
                    <TD className="text-right font-medium text-emerald-700">{formatMoney(r.commission, "LAK", locale)}</TD>
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

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-bold ${accent ? "text-cyan-700 text-base" : ""}`}>{value}</div>
    </div>
  );
}
