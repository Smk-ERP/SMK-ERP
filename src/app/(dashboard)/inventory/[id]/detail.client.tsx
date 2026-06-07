"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { fmtDateTime } from "@/lib/utils";
import { Plus, Minus, RefreshCw, AlertCircle, Package } from "lucide-react";

interface Txn {
  id: string; type: string; quantity: number; unit: string;
  unitCost: number | null; jobCode: string | null; note: string | null; createdAt: string;
}
interface Material {
  id: string; code: string; name: string; category: string | null; unit: string;
  unitCost: number; stockQty: number; reorderLevel: number; currency: string;
  transactions: Txn[];
}

export function MaterialDetail({ material }: { material: Material }) {
  const { t } = useI18n();
  const router = useRouter();
  const [txnType, setTxnType] = useState<"RECEIVE" | "ISSUE" | "ADJUST" | "RETURN">("RECEIVE");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isLow = material.stockQty <= material.reorderLevel;

  async function submitTxn() {
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/materials/${material.id}/transactions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: txnType, quantity: qty, note: note || null })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Failed");
      setNote(""); setQty(1);
      router.refresh();
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader
        title={material.name}
        subtitle={material.code}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "/dashboard" },
          { label: t("inventory.title"), href: "/inventory" },
          { label: material.name }
        ]}
        action={isLow ? <Badge className="bg-amber-100 text-amber-800"><AlertCircle className="h-3 w-3 mr-1 inline" />{t("inventory.lowStock")}</Badge> : <Badge variant="muted"><Package className="h-3 w-3 mr-1 inline" />OK</Badge>}
      />

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>{t("inventory.transactions")}</CardTitle></CardHeader>
          <CardContent>
            {material.transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">—</p>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>{t("common.date")}</TH>
                    <TH>Type</TH>
                    <TH className="text-right">Qty</TH>
                    <TH>{t("job.title")}</TH>
                    <TH>Note</TH>
                  </TR>
                </THead>
                <TBody>
                  {material.transactions.map((tx) => {
                    const sign = tx.type === "ISSUE" ? "−" : "+";
                    const cls = tx.type === "ISSUE" ? "text-rose-600" : "text-emerald-600";
                    return (
                      <TR key={tx.id}>
                        <TD className="text-xs text-muted-foreground">{fmtDateTime(tx.createdAt)}</TD>
                        <TD><Badge variant="muted">{t(`inventory.txnType.${tx.type}`)}</Badge></TD>
                        <TD className={`text-right font-medium ${cls}`}>{sign}{tx.quantity} <span className="text-xs">{tx.unit}</span></TD>
                        <TD className="font-mono text-xs">{tx.jobCode ?? "—"}</TD>
                        <TD className="text-xs text-muted-foreground">{tx.note ?? "—"}</TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Stock</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-3xl font-bold">{material.stockQty} <span className="text-base text-muted-foreground">{material.unit}</span></div>
              <div className="text-xs text-muted-foreground">Reorder at {material.reorderLevel}</div>
            </div>
            <div className="text-sm text-muted-foreground">
              {material.unitCost.toFixed(2)} {material.currency} / {material.unit}
            </div>

            <div className="pt-4 border-t space-y-3">
              <Label>{t("common.actions")}</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant={txnType === "RECEIVE" ? "default" : "outline"} onClick={() => setTxnType("RECEIVE")}>
                  <Plus className="h-4 w-4" />{t("inventory.receive")}
                </Button>
                <Button size="sm" variant={txnType === "ISSUE" ? "default" : "outline"} onClick={() => setTxnType("ISSUE")}>
                  <Minus className="h-4 w-4" />{t("inventory.issue")}
                </Button>
                <Button size="sm" variant={txnType === "ADJUST" ? "default" : "outline"} onClick={() => setTxnType("ADJUST")} className="col-span-2">
                  <RefreshCw className="h-4 w-4" />{t("inventory.adjust")}
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Quantity ({material.unit})</Label>
                <Input type="number" step="0.01" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Note</Label>
                <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              {err && <p className="text-rose-600 text-xs">{err}</p>}
              <Button className="w-full" disabled={busy || qty <= 0} onClick={submitTxn}>
                {busy ? t("common.loading") : t("common.submit")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
