"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";
import { fmtDate } from "@/lib/utils";
import { formatMoney, type CurrencyCode } from "@/lib/currency";
import { CalendarClock, Plus, Trash2, Save, AlertCircle, CheckCircle2, Clock, Wallet } from "lucide-react";

interface Schedule {
  id: string;
  label: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: string;
  note: string | null;
  paidSum: number;
  balance: number;
}

interface Draft {
  label: string;
  amount: number;
  dueDate: string;        // YYYY-MM-DD
  note?: string;
}

// Preset templates — common installment plans for sign business
const PRESETS = [
  {
    key: "deposit_balance",
    label: "50% มัดจำ / 50% ส่งมอบ",
    en: "50% Deposit / 50% On delivery",
    build: (total: number, today: Date) => [
      { label: "Deposit 50%", amount: +(total * 0.5).toFixed(2), dueDate: today.toISOString().slice(0, 10) },
      { label: "Balance 50% on delivery", amount: +(total * 0.5).toFixed(2), dueDate: new Date(today.getTime() + 14 * 86400000).toISOString().slice(0, 10) }
    ]
  },
  {
    key: "thirds",
    label: "30 / 40 / 30",
    en: "30% / 40% / 30%",
    build: (total: number, today: Date) => [
      { label: "Deposit 30%", amount: +(total * 0.3).toFixed(2), dueDate: today.toISOString().slice(0, 10) },
      { label: "Progress 40%", amount: +(total * 0.4).toFixed(2), dueDate: new Date(today.getTime() + 7 * 86400000).toISOString().slice(0, 10) },
      { label: "Final 30% on delivery", amount: +(total * 0.3).toFixed(2), dueDate: new Date(today.getTime() + 14 * 86400000).toISOString().slice(0, 10) }
    ]
  },
  {
    key: "net30",
    label: "Net 30 (เก็บงวดเดียว 30 วัน)",
    en: "Net 30 — single payment in 30 days",
    build: (total: number, today: Date) => [
      { label: "Net 30", amount: total, dueDate: new Date(today.getTime() + 30 * 86400000).toISOString().slice(0, 10) }
    ]
  },
  {
    key: "full_on_issue",
    label: "ครบงวดเดียวทันที",
    en: "Full payment due now",
    build: (total: number, today: Date) => [
      { label: "Full payment", amount: total, dueDate: today.toISOString().slice(0, 10) }
    ]
  }
];

function statusStyle(s: string) {
  switch (s) {
    case "PAID":      return { cls: "bg-emerald-100 text-emerald-700", Icon: CheckCircle2 };
    case "PARTIAL":   return { cls: "bg-cyan-100 text-cyan-700",       Icon: Wallet };
    case "OVERDUE":   return { cls: "bg-rose-100 text-rose-700",       Icon: AlertCircle };
    case "CANCELLED": return { cls: "bg-slate-200 text-slate-600",     Icon: AlertCircle };
    default:          return { cls: "bg-amber-100 text-amber-700",     Icon: Clock };
  }
}

export function PaymentScheduleSection({
  docId,
  docTotal,
  docCurrency,
  onPickSchedule
}: {
  docId: string;
  docTotal: number;
  docCurrency: string;
  /** Called when a schedule row is clicked → caller pre-fills the payment form */
  onPickSchedule?: (s: { id: string; balance: number; label: string }) => void;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/${docId}/schedule`, { cache: "no-store" });
      const j = await res.json();
      setSchedules(j.schedules ?? []);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [docId]);

  function applyPreset(presetKey: string) {
    const p = PRESETS.find((x) => x.key === presetKey);
    if (!p) return;
    setDrafts(p.build(docTotal, new Date()));
  }

  function addDraft() {
    const remaining = Math.max(0, docTotal - drafts.reduce((s, d) => s + d.amount, 0));
    setDrafts([...drafts, {
      label: `Installment ${drafts.length + 1}`,
      amount: remaining,
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
    }]);
  }
  function updateDraft(i: number, patch: Partial<Draft>) {
    setDrafts(drafts.map((d, idx) => idx === i ? { ...d, ...patch } : d));
  }
  function removeDraft(i: number) {
    setDrafts(drafts.filter((_, idx) => idx !== i));
  }

  async function save() {
    if (drafts.length === 0) { setErr("Add at least one installment"); return; }
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/finance/${docId}/schedule`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installments: drafts })
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error ?? "Save failed"); }
      setEditMode(false);
      setDrafts([]);
      load();
      router.refresh();
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  function enterEdit() {
    setDrafts(schedules.length > 0
      ? schedules.map((s) => ({ label: s.label, amount: s.amount, dueDate: s.dueDate.slice(0, 10), note: s.note ?? undefined }))
      : []);
    setEditMode(true);
  }

  const scheduledTotal = drafts.reduce((s, d) => s + d.amount, 0);
  const diff = +(docTotal - scheduledTotal).toFixed(2);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle><CalendarClock className="inline h-5 w-5 mr-2 text-cyan-600" />Payment Schedule</CardTitle>
        {!editMode && (
          <Button size="sm" variant="outline" onClick={enterEdit}>
            <Plus className="h-3 w-3" /> {schedules.length > 0 ? "Edit plan" : "Set up plan"}
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {/* VIEW MODE */}
        {!editMode && (
          <>
            {loading ? (
              <p className="text-sm text-muted-foreground py-4 text-center">{t("common.loading")}</p>
            ) : schedules.length === 0 ? (
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <CalendarClock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">No payment schedule yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click <strong>Set up plan</strong> to add installments (deposit / progress / final)
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {schedules.map((s, i) => {
                  const st = statusStyle(s.status);
                  const Icon = st.Icon;
                  const isLate = s.status === "OVERDUE";
                  const clickable = !!onPickSchedule && s.balance > 0 && s.status !== "CANCELLED";
                  return (
                    <div
                      key={s.id}
                      className={`flex items-center gap-3 rounded-lg border p-3 ${isLate ? "border-rose-300" : ""} ${clickable ? "hover:bg-muted/40 cursor-pointer" : ""}`}
                      onClick={() => clickable && onPickSchedule({ id: s.id, balance: s.balance, label: s.label })}
                    >
                      <div className={`flex items-center justify-center h-9 w-9 rounded-full ${st.cls.replace("text-", "bg-").replace("100", "200")} ${st.cls}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">#{i + 1} — {s.label}</span>
                          <Badge className={st.cls + " text-[10px] py-0"}>{s.status}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Due {fmtDate(s.dueDate)} {s.note && `• ${s.note}`}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-sm">{formatMoney(s.amount, s.currency as CurrencyCode, locale)}</div>
                        {s.paidSum > 0 && s.balance > 0 && (
                          <div className="text-[10px] text-emerald-600">−{formatMoney(s.paidSum, s.currency as CurrencyCode, locale)} paid</div>
                        )}
                        {s.balance > 0 && (
                          <div className={`text-[10px] ${isLate ? "text-rose-600 font-medium" : "text-muted-foreground"}`}>
                            {formatMoney(s.balance, s.currency as CurrencyCode, locale)} due
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {onPickSchedule && schedules.some((s) => s.balance > 0) && (
                  <p className="text-xs text-cyan-700 mt-2 italic">💡 Click an installment row to record payment for it</p>
                )}
              </div>
            )}
          </>
        )}

        {/* EDIT MODE */}
        {editMode && (
          <div className="space-y-3">
            {/* Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESETS.map((p) => (
                <Button key={p.key} size="sm" variant="outline" onClick={() => applyPreset(p.key)} className="h-auto py-2 flex-col items-start">
                  <span className="font-semibold">{p.label}</span>
                  <span className="text-[10px] text-muted-foreground">{p.en}</span>
                </Button>
              ))}
            </div>

            {/* Installment rows */}
            <div className="space-y-2">
              {drafts.map((d, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5 space-y-1">
                    <Label className="text-xs">Label</Label>
                    <Input value={d.label} onChange={(e) => updateDraft(i, { label: e.target.value })} className="h-9" />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">Due date</Label>
                    <Input type="date" value={d.dueDate} onChange={(e) => updateDraft(i, { dueDate: e.target.value })} className="h-9" />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">Amount ({docCurrency})</Label>
                    <Input type="number" step="0.01" value={d.amount} onChange={(e) => updateDraft(i, { amount: Number(e.target.value) })} className="h-9 text-right" />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => removeDraft(i)}>
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={addDraft}>
                <Plus className="h-3 w-3" /> Add installment
              </Button>
            </div>

            {/* Summary */}
            <div className={`rounded-lg p-3 text-sm ${Math.abs(diff) < 0.01 ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
              <div className="flex justify-between">
                <span>Scheduled</span>
                <span className="font-bold">{formatMoney(scheduledTotal, docCurrency as CurrencyCode, locale)}</span>
              </div>
              <div className="flex justify-between">
                <span>Document total</span>
                <span className="font-bold">{formatMoney(docTotal, docCurrency as CurrencyCode, locale)}</span>
              </div>
              {Math.abs(diff) >= 0.01 && (
                <div className="flex justify-between pt-1 border-t border-amber-200 mt-1">
                  <span>{diff > 0 ? "Unscheduled" : "Over-scheduled"}</span>
                  <span className="font-bold">{formatMoney(Math.abs(diff), docCurrency as CurrencyCode, locale)}</span>
                </div>
              )}
            </div>

            {err && <p className="text-rose-600 text-sm">{err}</p>}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setEditMode(false); setDrafts([]); setErr(null); }}>{t("common.cancel")}</Button>
              <Button onClick={save} disabled={busy || drafts.length === 0}>
                <Save className="h-4 w-4" /> {busy ? t("common.loading") : "Save plan"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
