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
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";
import { fmtDate, fmtDateTime } from "@/lib/utils";
import { formatMoney, type CurrencyCode } from "@/lib/currency";
import { FileDown, Wallet, Plus, Check, CalendarClock } from "lucide-react";
import { PaymentScheduleSection } from "@/components/finance/payment-schedule";

interface Doc {
  id: string; code: string; docType: string;
  currency: string; language: string;
  issuedAt: string; paidAt: string | null;
  amount: number; taxAmount: number; taxPercent: number; total: number;
  paidSum: number; balance: number;
  note: string | null; quotationCode: string | null;
  items: { title: string; description?: string | null; quantity?: number; unit?: string; unitPrice?: number; lineTotal?: number }[];
  createdBy: string;
  customer: { id: string; name: string; code: string; companyName: string | null; phone: string | null; address: string | null } | null;
  job: { id: string; code: string } | null;
  payments: { id: string; amount: number; currency: string; method: string; reference: string | null; receivedAt: string }[];
}

export function FinanceDetail({ doc }: { doc: Doc }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState(doc.balance);
  const [payMethod, setPayMethod] = useState("CASH");
  const [payRef, setPayRef] = useState("");
  const [linkedScheduleId, setLinkedScheduleId] = useState<string | null>(null);
  const [linkedScheduleLabel, setLinkedScheduleLabel] = useState<string | null>(null);

  function pickSchedule(s: { id: string; balance: number; label: string }) {
    setLinkedScheduleId(s.id);
    setLinkedScheduleLabel(s.label);
    setPayAmount(s.balance);
    // Scroll to payment form
    setTimeout(() => document.getElementById("record-payment-form")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  }

  async function addPayment() {
    if (payAmount <= 0) return;
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/finance/${doc.id}/payments`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: payAmount, currency: doc.currency,
          method: payMethod, reference: payRef || null,
          scheduleId: linkedScheduleId
        })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Failed");
      setPayRef("");
      setLinkedScheduleId(null);
      setLinkedScheduleLabel(null);
      router.refresh();
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader
        title={`${t(`finance.docTypes.${doc.docType}`)} ${doc.code}`}
        subtitle={doc.customer?.name}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "/dashboard" },
          { label: t("finance.title"), href: "/finance" },
          { label: doc.code }
        ]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {doc.paidAt ? (
              <Badge className="bg-emerald-100 text-emerald-700 text-sm py-1 px-3"><Check className="h-3 w-3 inline mr-1" />{t("finance.paid")}</Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-700 text-sm py-1 px-3">{t("finance.unpaid")}</Badge>
            )}
            <Button asChild variant="outline">
              <a href={`/api/finance/${doc.id}/pdf?lang=${doc.language}`} target="_blank" rel="noreferrer">
                <FileDown className="h-4 w-4" /> {t("common.exportPdf")}
              </a>
            </Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>{t("quotation.items")}</CardTitle></CardHeader>
          <CardContent>
            {doc.items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No line items — amount captured as flat total</p>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>#</TH>
                    <TH>Title</TH>
                    <TH className="text-right">Qty</TH>
                    <TH className="text-right">Unit</TH>
                    <TH className="text-right">Total</TH>
                  </TR>
                </THead>
                <TBody>
                  {doc.items.map((it, i) => (
                    <TR key={i}>
                      <TD>{i + 1}</TD>
                      <TD>
                        <div className="font-medium">{it.title}</div>
                        {it.description && <div className="text-xs text-muted-foreground">{it.description}</div>}
                      </TD>
                      <TD className="text-right">{it.quantity ?? "—"} {it.unit ?? ""}</TD>
                      <TD className="text-right">{it.unitPrice != null ? formatMoney(it.unitPrice, doc.currency as CurrencyCode, locale) : "—"}</TD>
                      <TD className="text-right font-medium">{it.lineTotal != null ? formatMoney(it.lineTotal, doc.currency as CurrencyCode, locale) : "—"}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
            {doc.note && <p className="mt-4 text-sm italic text-muted-foreground">{doc.note}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("common.total")}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{t("common.subtotal")}</span><span>{formatMoney(doc.amount, doc.currency as CurrencyCode, locale)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("common.tax")} ({doc.taxPercent}%)</span><span>{formatMoney(doc.taxAmount, doc.currency as CurrencyCode, locale)}</span></div>
            <hr />
            <div className="flex justify-between font-bold text-base"><span>{t("common.grandTotal")}</span><span className="text-cyan-600">{formatMoney(doc.total, doc.currency as CurrencyCode, locale)}</span></div>
            <div className="flex justify-between"><span className="text-emerald-700">Paid</span><span className="text-emerald-700">− {formatMoney(doc.paidSum, doc.currency as CurrencyCode, locale)}</span></div>
            <hr />
            <div className={`flex justify-between font-bold ${doc.balance > 0 ? "text-rose-600" : "text-emerald-600"}`}>
              <span>{t("finance.balance")}</span>
              <span>{formatMoney(doc.balance, doc.currency as CurrencyCode, locale)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Schedule (installment plan) */}
      <div className="mb-4">
        <PaymentScheduleSection
          docId={doc.id}
          docTotal={doc.total}
          docCurrency={doc.currency}
          onPickSchedule={pickSchedule}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle><Wallet className="inline h-5 w-5 mr-2" />{t("finance.payments")} ({doc.payments.length})</CardTitle></CardHeader>
          <CardContent>
            {doc.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No payments yet</p>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>{t("common.date")}</TH>
                    <TH>{t("finance.method")}</TH>
                    <TH>Reference</TH>
                    <TH className="text-right">{t("finance.amount")}</TH>
                  </TR>
                </THead>
                <TBody>
                  {doc.payments.map((p) => (
                    <TR key={p.id}>
                      <TD className="text-xs text-muted-foreground">{fmtDateTime(p.receivedAt)}</TD>
                      <TD><Badge variant="muted">{p.method}</Badge></TD>
                      <TD className="text-xs">{p.reference ?? "—"}</TD>
                      <TD className="text-right font-medium text-emerald-700">{formatMoney(p.amount, p.currency as CurrencyCode, locale)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {doc.balance > 0 && (
          <Card id="record-payment-form">
            <CardHeader><CardTitle><Plus className="inline h-5 w-5 mr-2" />{t("finance.markPaid")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {linkedScheduleId && linkedScheduleLabel && (
                <div className="flex items-center justify-between rounded-lg bg-cyan-50 border border-cyan-200 px-3 py-2 text-sm">
                  <div>
                    <CalendarClock className="inline h-4 w-4 mr-1 text-cyan-700" />
                    <span className="text-cyan-900 font-medium">Linked to:</span> {linkedScheduleLabel}
                  </div>
                  <button
                    onClick={() => { setLinkedScheduleId(null); setLinkedScheduleLabel(null); }}
                    className="text-cyan-700 hover:text-cyan-900 text-xs"
                  >
                    Unlink ×
                  </button>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>{t("finance.amount")} ({doc.currency})</Label>
                <Input type="number" step="0.01" value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("finance.method")}</Label>
                <Select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                  <option>CASH</option>
                  <option>BANK_TRANSFER</option>
                  <option>QR</option>
                  <option>CHEQUE</option>
                  <option>OTHER</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Reference</Label>
                <Input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="Transaction ID / cheque no." />
              </div>
              {err && <p className="text-rose-600 text-xs">{err}</p>}
              <Button className="w-full" disabled={busy || payAmount <= 0} onClick={addPayment}>
                {busy ? t("common.loading") : t("finance.markPaid")}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle>Reference</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          {doc.customer && (
            <div><span className="text-muted-foreground">{t("quotation.customer")}:</span> <Link href={`/customers/${doc.customer.id}`} className="text-primary hover:underline">{doc.customer.name}</Link></div>
          )}
          {doc.quotationCode && <div className="text-muted-foreground text-xs">Source quotation: {doc.quotationCode}</div>}
          {doc.job && <div><span className="text-muted-foreground">{t("materialRequest.job")}:</span> <Link href={`/jobs/${doc.job.id}`} className="text-primary hover:underline font-mono">{doc.job.code}</Link></div>}
          <div className="text-xs text-muted-foreground pt-2">Created by {doc.createdBy} on {fmtDate(doc.issuedAt)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
