"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney, type CurrencyCode } from "@/lib/currency";
import { Send, Check, X, ArrowRightCircle, FileDown, Briefcase } from "lucide-react";
import { fmtDate } from "@/lib/utils";
import { WorkflowSteps, quotationLifecycle, quotationStatusToStep } from "@/components/ui/workflow-steps";

interface QDTO {
  id: string;
  code: string;
  status: string;
  currency: string;
  language: string;
  issueDate: string;
  validUntil: string | null;
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  marginActual: number;
  note: string | null;
  termsText: string | null;
  customer: { id: string; name: string; code: string; companyName: string | null; phone: string | null; address: string | null };
  items: { id: string; title: string; description: string | null; signType: string; widthMm: number | null; heightMm: number | null; quantity: number; unit: string; unitPrice: number; lineTotal: number }[];
  createdBy: string;
  jobId: string | null;
  jobCode: string | null;
}

export function QuotationDetail({ q }: { q: QDTO }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function changeStatus(status: string, reason?: string) {
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/quotations/${q.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason })
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Failed");
      }
      router.refresh();
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function convert() {
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/quotations/${q.id}/convert-to-job`, { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Failed");
      router.push(`/jobs/${j.job.id}`);
    } catch (e: any) { setErr(e.message); setBusy(false); }
  }

  return (
    <div>
      <PageHeader
        title={`${t("quotation.title")} ${q.code}`}
        subtitle={`${q.customer.name} • ${fmtDate(q.issueDate)}`}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "/dashboard" },
          { label: t("quotation.title"), href: "/quotations" },
          { label: q.code }
        ]}
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <a href={`/api/quotations/${q.id}/pdf?lang=${q.language}`} target="_blank" rel="noreferrer">
                <FileDown className="h-4 w-4" /> {t("common.exportPdf")}
              </a>
            </Button>
            {q.status === "DRAFT" && (
              <Button onClick={() => changeStatus("SENT")} disabled={busy}>
                <Send className="h-4 w-4" /> Send
              </Button>
            )}
            {q.status === "SENT" && (
              <>
                <Button onClick={() => changeStatus("APPROVED")} disabled={busy}>
                  <Check className="h-4 w-4" /> {t("common.approve")}
                </Button>
                <Button variant="outline" onClick={() => {
                  const r = prompt("Reason?");
                  if (r) changeStatus("REJECTED", r);
                }} disabled={busy}>
                  <X className="h-4 w-4" /> {t("common.reject")}
                </Button>
              </>
            )}
            {q.status === "APPROVED" && !q.jobId && (
              <Button onClick={convert} disabled={busy} variant="brand">
                <ArrowRightCircle className="h-4 w-4" /> {t("quotation.convertToJob")}
              </Button>
            )}
            {q.jobCode && (
              <Button asChild variant="outline">
                <Link href={`/jobs/${q.jobId}`}><Briefcase className="h-4 w-4" /> {q.jobCode}</Link>
              </Button>
            )}
          </div>
        }
      />

      {err && <p className="text-rose-600 text-sm mb-3">{err}</p>}

      {/* Workflow lifecycle indicator */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <WorkflowSteps
            steps={quotationLifecycle(locale)}
            currentKey={quotationStatusToStep(q.status, false, false, false)}
          />
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row justify-between items-center">
            <CardTitle>{t("quotation.items")}</CardTitle>
            <StatusBadge status={q.status} label={t(`quotation.status.${q.status}`)} />
          </CardHeader>
          <CardContent>
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
                {q.items.map((it, i) => (
                  <TR key={it.id}>
                    <TD>{i + 1}</TD>
                    <TD>
                      <div className="font-medium">{it.title}</div>
                      {it.description && <div className="text-xs text-muted-foreground">{it.description}</div>}
                    </TD>
                    <TD className="text-right">{it.quantity}</TD>
                    <TD className="text-right">{formatMoney(it.unitPrice, q.currency as CurrencyCode, locale)}</TD>
                    <TD className="text-right font-medium">{formatMoney(it.lineTotal, q.currency as CurrencyCode, locale)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            {q.note && <div className="mt-4 text-sm"><strong>Note:</strong> {q.note}</div>}
            {q.termsText && <div className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap">{q.termsText}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("common.subtotal")}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label={t("common.subtotal")} value={formatMoney(q.subtotal, q.currency as CurrencyCode, locale)} />
            <Row label={`${t("common.discount")} (${q.discountPercent}%)`} value={`− ${formatMoney(q.discountAmount + q.subtotal * (q.discountPercent / 100), q.currency as CurrencyCode, locale)}`} />
            <Row label={`${t("common.tax")} (${q.taxPercent}%)`} value={formatMoney(q.taxAmount, q.currency as CurrencyCode, locale)} />
            <hr />
            <Row label={t("common.grandTotal")} value={formatMoney(q.total, q.currency as CurrencyCode, locale)} strong />
            <Row label={t("quotation.margin")} value={`${q.marginActual.toFixed(1)}%`} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t("quotation.customer")}</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          <div className="font-medium"><Link href={`/customers/${q.customer.id}`} className="text-primary hover:underline">{q.customer.name}</Link></div>
          {q.customer.companyName && <div className="text-muted-foreground">{q.customer.companyName}</div>}
          {q.customer.phone && <div>{q.customer.phone}</div>}
          {q.customer.address && <div className="text-muted-foreground">{q.customer.address}</div>}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-bold text-base" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
