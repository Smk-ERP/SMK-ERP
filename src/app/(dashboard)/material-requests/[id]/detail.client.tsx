"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";
import { fmtDate } from "@/lib/utils";
import { Check, X, Truck, FileDown } from "lucide-react";

interface MR {
  id: string; code: string; status: string; note: string | null; createdAt: string;
  job: { id: string; code: string; customer: string; status: string };
  requester: string;
  items: { id: string; material: { code: string; name: string; stockQty: number }; quantity: number; unit: string }[];
}

const STATUS_TO_BADGE: Record<string, string> = {
  REQUESTED: "DRAFT", APPROVED: "APPROVED", ISSUED: "CONVERTED", REJECTED: "REJECTED"
};

export function MRDetail({ mr }: { mr: MR }) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function changeStatus(status: "APPROVED" | "ISSUED" | "REJECTED") {
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/material-requests/${mr.id}/status`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Failed");
      router.refresh();
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader
        title={`${t("materialRequest.title")} ${mr.code}`}
        subtitle={`${mr.job.customer} • ${fmtDate(mr.createdAt)}`}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "/dashboard" },
          { label: t("materialRequest.title"), href: "/material-requests" },
          { label: mr.code }
        ]}
        action={
          <div className="flex gap-2 items-center flex-wrap">
            <StatusBadge status={STATUS_TO_BADGE[mr.status]} label={t(`materialRequest.status.${mr.status}`)} className="text-sm py-1 px-3" />
            <Button asChild variant="outline" size="sm">
              <a href={`/api/material-requests/${mr.id}/pdf?lang=lo`} target="_blank" rel="noreferrer">
                <FileDown className="h-4 w-4" /> {t("common.exportPdf")}
              </a>
            </Button>
            {mr.status === "REQUESTED" && (
              <>
                <Button size="sm" onClick={() => changeStatus("APPROVED")} disabled={busy}>
                  <Check className="h-4 w-4" /> {t("materialRequest.approve")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => changeStatus("REJECTED")} disabled={busy}>
                  <X className="h-4 w-4" /> {t("materialRequest.reject")}
                </Button>
              </>
            )}
            {mr.status === "APPROVED" && (
              <Button size="sm" variant="brand" onClick={() => changeStatus("ISSUED")} disabled={busy}>
                <Truck className="h-4 w-4" /> {t("materialRequest.issue")}
              </Button>
            )}
          </div>
        }
      />

      {err && <p className="text-rose-600 text-sm mb-3">{err}</p>}

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>{t("materialRequest.items")}</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>{t("inventory.code")}</TH>
                  <TH>{t("inventory.name")}</TH>
                  <TH className="text-right">Qty</TH>
                  <TH className="text-right">In stock</TH>
                </TR>
              </THead>
              <TBody>
                {mr.items.map((it) => {
                  const short = it.material.stockQty < it.quantity;
                  return (
                    <TR key={it.id}>
                      <TD className="font-mono text-xs">{it.material.code}</TD>
                      <TD>{it.material.name}</TD>
                      <TD className="text-right font-medium">{it.quantity} <span className="text-xs text-muted-foreground">{it.unit}</span></TD>
                      <TD className={`text-right text-xs ${short ? "text-rose-600 font-medium" : "text-muted-foreground"}`}>
                        {it.material.stockQty} {short ? "⚠" : ""}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
            {mr.note && <p className="mt-4 text-sm italic text-muted-foreground">{mr.note}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Reference</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">{t("materialRequest.job")}:</span> <Link href={`/jobs/${mr.job.id}`} className="text-primary hover:underline font-mono">{mr.job.code}</Link></div>
            <div><span className="text-muted-foreground">{t("quotation.customer")}:</span> {mr.job.customer}</div>
            <div><span className="text-muted-foreground">{t("materialRequest.requester")}:</span> {mr.requester}</div>
            <div><span className="text-muted-foreground">{t("common.date")}:</span> {fmtDate(mr.createdAt)}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
