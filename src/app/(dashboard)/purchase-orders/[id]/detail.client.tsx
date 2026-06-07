"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";
import { fmtDate } from "@/lib/utils";
import { formatMoney, type CurrencyCode } from "@/lib/currency";
import { Send, PackageCheck, FileDown, X, Trash2, CheckCircle2 } from "lucide-react";

interface PO {
  id: string;
  code: string;
  status: string;
  supplier: { name: string; address: string | null; phone: string | null; email: string | null; taxId: string | null };
  currency: string;
  language: string;
  issueDate: string;
  expectedDate: string | null;
  receivedDate: string | null;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  shipping: number;
  total: number;
  note: string | null;
  termsText: string | null;
  createdBy: string;
  items: {
    id: string;
    materialId: string | null;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    lineTotal: number;
    receivedQty: number;
    note: string | null;
  }[];
}

const STATUS_CLS: Record<string, string> = {
  DRAFT:     "bg-slate-100 text-slate-700",
  SENT:      "bg-cyan-100 text-cyan-700",
  PARTIAL:   "bg-amber-100 text-amber-700",
  RECEIVED:  "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-rose-100 text-rose-700"
};

export function PODetail({ po }: { po: PO }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [receiveQtys, setReceiveQtys] = useState<Record<string, number>>(
    Object.fromEntries(po.items.map(it => [it.id, it.receivedQty]))
  );

  async function send() {
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/purchase-orders/${po.id}/status`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SENT" })
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error ?? "Failed"); }
      router.refresh();
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function receive(markFull: boolean) {
    setBusy(true); setErr(null);
    try {
      // If markFull, set all receivedQty to ordered quantity
      const receiveItems = po.items.map(it => ({
        itemId: it.id,
        receivedQty: markFull ? it.quantity : (receiveQtys[it.id] ?? it.receivedQty)
      }));

      // Determine status: all received → RECEIVED, partial → PARTIAL
      const allReceived = receiveItems.every((r, i) => r.receivedQty >= po.items[i].quantity);
      const anyReceived = receiveItems.some(r => r.receivedQty > 0);
      const status = allReceived ? "RECEIVED" : anyReceived ? "PARTIAL" : po.status;

      const res = await fetch(`/api/purchase-orders/${po.id}/status`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, receiveItems })
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error ?? "Failed"); }
      router.refresh();
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function cancel() {
    if (!confirm("Cancel this PO?")) return;
    setBusy(true); setErr(null);
    try {
      await fetch(`/api/purchase-orders/${po.id}/status`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" })
      });
      router.refresh();
    } finally { setBusy(false); }
  }

  async function destroy() {
    if (!confirm(`Delete ${po.code}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/purchase-orders/${po.id}`, { method: "DELETE" });
      if (res.ok) router.push("/purchase-orders");
    } finally { setBusy(false); }
  }

  const canSend = po.status === "DRAFT";
  const canReceive = po.status === "SENT" || po.status === "PARTIAL";
  const canCancel = po.status === "DRAFT" || po.status === "SENT" || po.status === "PARTIAL";
  const isClosed = po.status === "RECEIVED" || po.status === "CANCELLED";

  return (
    <div>
      <PageHeader
        title={`${t("po.title")} ${po.code}`}
        subtitle={po.supplier.name}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "/dashboard" },
          { label: t("po.title"), href: "/purchase-orders" },
          { label: po.code }
        ]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={STATUS_CLS[po.status] + " text-sm py-1 px-3"}>{t(`po.status.${po.status}`)}</Badge>
            <Button asChild variant="outline">
              <a href={`/api/purchase-orders/${po.id}/pdf?lang=${po.language}`} target="_blank" rel="noreferrer">
                <FileDown className="h-4 w-4" /> {t("common.exportPdf")}
              </a>
            </Button>
            {canSend && (
              <Button onClick={send} disabled={busy}>
                <Send className="h-4 w-4" /> {t("po.send")}
              </Button>
            )}
            {po.status === "DRAFT" && (
              <Button size="sm" variant="destructive" onClick={destroy} disabled={busy}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {canCancel && po.status !== "DRAFT" && (
              <Button variant="outline" onClick={cancel} disabled={busy}>
                <X className="h-4 w-4" /> Cancel
              </Button>
            )}
          </div>
        }
      />

      {err && <p className="text-rose-600 text-sm mb-3">{err}</p>}

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Items</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>#</TH>
                  <TH>{t("po.itemDesc")}</TH>
                  <TH className="text-right">Qty</TH>
                  <TH className="text-right">Unit price</TH>
                  <TH className="text-right">Line total</TH>
                  {canReceive && <TH className="text-right">Receive</TH>}
                  {(po.status === "PARTIAL" || po.status === "RECEIVED") && <TH className="text-right">Received</TH>}
                </TR>
              </THead>
              <TBody>
                {po.items.map((it, i) => (
                  <TR key={it.id}>
                    <TD>{i + 1}</TD>
                    <TD>
                      <div className="font-medium">{it.description}</div>
                      {it.note && <div className="text-xs text-muted-foreground">{it.note}</div>}
                      {it.materialId && <div className="text-[10px] text-cyan-600">↔ inventory linked</div>}
                    </TD>
                    <TD className="text-right">{it.quantity} {it.unit}</TD>
                    <TD className="text-right">{formatMoney(it.unitPrice, po.currency as CurrencyCode, locale)}</TD>
                    <TD className="text-right font-medium">{formatMoney(it.lineTotal, po.currency as CurrencyCode, locale)}</TD>
                    {canReceive && (
                      <TD className="text-right">
                        <Input
                          type="number"
                          step="0.01"
                          value={receiveQtys[it.id] ?? it.receivedQty}
                          onChange={(e) => setReceiveQtys({ ...receiveQtys, [it.id]: Number(e.target.value) })}
                          className="h-8 w-24 text-right"
                        />
                      </TD>
                    )}
                    {(po.status === "PARTIAL" || po.status === "RECEIVED") && (
                      <TD className="text-right">
                        <Badge className={it.receivedQty >= it.quantity ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                          {it.receivedQty} / {it.quantity}
                        </Badge>
                      </TD>
                    )}
                  </TR>
                ))}
              </TBody>
            </Table>
            {canReceive && (
              <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                <Button variant="outline" size="sm" onClick={() => receive(false)} disabled={busy}>
                  <PackageCheck className="h-4 w-4" /> {t("po.partialReceive")}
                </Button>
                <Button variant="brand" onClick={() => receive(true)} disabled={busy}>
                  <CheckCircle2 className="h-4 w-4" /> {t("po.receive")} (all)
                </Button>
              </div>
            )}
            {po.note && <p className="mt-4 text-sm italic text-muted-foreground">{po.note}</p>}
            {po.termsText && <p className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap">{po.termsText}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("common.total")}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label={t("common.subtotal")} value={formatMoney(po.subtotal, po.currency as CurrencyCode, locale)} />
            {po.shipping > 0 && <Row label={t("po.shipping")} value={formatMoney(po.shipping, po.currency as CurrencyCode, locale)} />}
            {po.taxPercent > 0 && <Row label={`${t("common.tax")} (${po.taxPercent}%)`} value={formatMoney(po.taxAmount, po.currency as CurrencyCode, locale)} />}
            <hr />
            <Row label={t("common.grandTotal")} value={formatMoney(po.total, po.currency as CurrencyCode, locale)} strong />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t("po.supplier")} & Reference</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="font-medium">{po.supplier.name}</div>
            {po.supplier.address && <div className="text-muted-foreground">{po.supplier.address}</div>}
            {po.supplier.phone && <div>{po.supplier.phone}</div>}
            {po.supplier.email && <div className="text-cyan-600">{po.supplier.email}</div>}
            {po.supplier.taxId && <div className="text-xs text-muted-foreground">Tax ID: {po.supplier.taxId}</div>}
          </div>
          <div className="text-right sm:text-left">
            <div className="text-xs text-muted-foreground">{t("po.issueDate")}</div>
            <div className="font-medium">{fmtDate(po.issueDate)}</div>
            {po.expectedDate && (
              <>
                <div className="text-xs text-muted-foreground mt-1">{t("po.expectedDate")}</div>
                <div className="font-medium">{fmtDate(po.expectedDate)}</div>
              </>
            )}
            {po.receivedDate && (
              <>
                <div className="text-xs text-muted-foreground mt-1">{t("po.receivedDate")}</div>
                <div className="font-medium text-emerald-600">{fmtDate(po.receivedDate)}</div>
              </>
            )}
            <div className="text-xs text-muted-foreground mt-2">Created by {po.createdBy}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-bold text-base" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span className={strong ? "text-cyan-600" : ""}>{value}</span>
    </div>
  );
}
