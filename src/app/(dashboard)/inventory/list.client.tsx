"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useI18n } from "@/lib/i18n/context";
import { Plus, Search, AlertCircle, Package } from "lucide-react";

interface MatRow {
  id: string; code: string; name: string; category: string | null;
  unit: string; unitCost: number; stockQty: number; reorderLevel: number;
  currency: string; isLow: boolean;
}

export function InventoryList({ initial }: { initial: MatRow[] }) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [lowOnly, setLowOnly] = useState(false);

  const rows = useMemo(() => {
    const ql = q.toLowerCase();
    return initial.filter((m) => {
      if (lowOnly && !m.isLow) return false;
      if (!ql) return true;
      return m.code.toLowerCase().includes(ql) || m.name.toLowerCase().includes(ql) ||
             (m.category ?? "").toLowerCase().includes(ql);
    });
  }, [initial, q, lowOnly]);

  const lowCount = initial.filter((m) => m.isLow).length;

  return (
    <div>
      <PageHeader
        title={t("inventory.title")}
        breadcrumb={[{ label: t("nav.dashboard"), href: "/dashboard" }, { label: t("inventory.title") }]}
        action={
          <Button asChild size="lg">
            <Link href="/inventory/new"><Plus className="h-5 w-5" /> {t("inventory.newMaterial")}</Link>
          </Button>
        }
      />

      {lowCount > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{lowCount} {t("inventory.lowStock")}</span>
        </div>
      )}

      <Card className="p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Button variant={lowOnly ? "default" : "outline"} onClick={() => setLowOnly((v) => !v)}>
            <AlertCircle className="h-4 w-4" /> {t("inventory.lowStock")}
          </Button>
        </div>
      </Card>

      <Card>
        {rows.length === 0 ? (
          <EmptyState title={t("common.noData")} />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{t("inventory.code")}</TH>
                <TH>{t("inventory.name")}</TH>
                <TH>{t("inventory.category")}</TH>
                <TH className="text-right">{t("inventory.stockQty")}</TH>
                <TH className="text-right">{t("inventory.reorderLevel")}</TH>
                <TH className="text-right">{t("inventory.unitCost")}</TH>
                <TH>{t("common.status")}</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((m) => (
                <TR key={m.id}>
                  <TD className="font-mono text-xs">
                    <Link href={`/inventory/${m.id}`} className="text-primary hover:underline">{m.code}</Link>
                  </TD>
                  <TD>
                    <Link href={`/inventory/${m.id}`} className="font-medium hover:underline">{m.name}</Link>
                  </TD>
                  <TD className="text-muted-foreground text-xs">{m.category ?? "—"}</TD>
                  <TD className="text-right font-medium">{m.stockQty} <span className="text-xs text-muted-foreground">{m.unit}</span></TD>
                  <TD className="text-right text-xs text-muted-foreground">{m.reorderLevel}</TD>
                  <TD className="text-right">{m.unitCost.toFixed(2)} <span className="text-xs text-muted-foreground">{m.currency}</span></TD>
                  <TD>
                    {m.isLow ? <Badge className="bg-amber-100 text-amber-800">{t("inventory.lowStock")}</Badge> : <Badge variant="muted"><Package className="h-3 w-3 mr-1 inline" />OK</Badge>}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
