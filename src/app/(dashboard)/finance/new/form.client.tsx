"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { useI18n } from "@/lib/i18n/context";
import { CURRENCIES } from "@/lib/enums";

const TYPES = ["BILLING_NOTE", "INVOICE", "RECEIPT", "PAYMENT_SLIP", "DELIVERY_NOTE", "INSTALLATION_REPORT"];

interface Quot { id: string; code: string; customer: string; customerId: string; total: number; currency: string }
interface Job  { id: string; code: string; customer: string }
interface Cust { id: string; name: string; code: string }

export function NewFinanceDoc({ quotations, jobs, customers, initial }: {
  quotations: Quot[]; jobs: Job[]; customers: Cust[];
  initial?: { jobId?: string; quotationId?: string; type?: string };
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [docType, setDocType] = useState(initial?.type ?? "INVOICE");
  const [quotationId, setQuotationId] = useState(initial?.quotationId ?? "");
  const [jobId, setJobId] = useState(initial?.jobId ?? "");
  const [customerId, setCustomerId] = useState("");
  const [currency, setCurrency] = useState<"LAK" | "THB" | "USD">("LAK");
  const [language, setLanguage] = useState<"lo" | "th" | "en">("lo");
  const [amount, setAmount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Auto-fill from selected quotation
  useEffect(() => {
    if (!quotationId) return;
    const q = quotations.find((x) => x.id === quotationId);
    if (q) {
      setAmount(q.total);
      setCurrency(q.currency as any);
      setCustomerId(q.customerId);
    }
  }, [quotationId, quotations]);

  async function submit() {
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/finance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType, quotationId: quotationId || null, jobId: jobId || null,
          customerId: customerId || null,
          currency, language, amount, taxPercent, note
        })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Save failed");
      router.push(`/finance/${j.doc.id}`);
    } catch (e: any) { setErr(e.message); setBusy(false); }
  }

  const total = amount + amount * (taxPercent / 100);

  return (
    <div>
      <PageHeader
        title={t("finance.newDoc")}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "/dashboard" },
          { label: t("finance.title"), href: "/finance" },
          { label: t("finance.newDoc") }
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Document</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("finance.type")} *</Label>
              <Select value={docType} onChange={(e) => setDocType(e.target.value)}>
                {TYPES.map((tt) => <option key={tt} value={tt}>{t(`finance.docTypes.${tt}`)}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Source quotation (optional)</Label>
              <Select value={quotationId} onChange={(e) => setQuotationId(e.target.value)}>
                <option value="">—</option>
                {quotations.map((q) => (
                  <option key={q.id} value={q.id}>{q.code} — {q.customer} ({q.currency} {q.total.toLocaleString()})</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("materialRequest.job")} (optional)</Label>
              <Select value={jobId} onChange={(e) => setJobId(e.target.value)}>
                <option value="">—</option>
                {jobs.map((j) => <option key={j.id} value={j.id}>{j.code} — {j.customer}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("quotation.customer")}</Label>
              <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">—</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("common.currency")}</Label>
              <Select value={currency} onChange={(e) => setCurrency(e.target.value as any)}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>PDF {t("common.language")}</Label>
              <Select value={language} onChange={(e) => setLanguage(e.target.value as any)}>
                <option value="lo">ລາວ</option>
                <option value="th">ไทย</option>
                <option value="en">English</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("finance.amount")}</Label>
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("common.tax")} %</Label>
              <Input type="number" step="0.01" value={taxPercent} onChange={(e) => setTaxPercent(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Note</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{t("common.subtotal")}</span><span>{amount.toLocaleString()} {currency}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("common.tax")} ({taxPercent}%)</span><span>{(amount * taxPercent / 100).toLocaleString()} {currency}</span></div>
            <hr />
            <div className="flex justify-between font-bold text-base"><span>{t("common.grandTotal")}</span><span className="text-cyan-600">{total.toLocaleString()} {currency}</span></div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            {err && <p className="text-rose-600 text-sm w-full">{err}</p>}
            <Button className="w-full" size="lg" disabled={busy || amount <= 0} onClick={submit}>
              {busy ? t("common.loading") : t("common.save")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
