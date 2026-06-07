"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useI18n } from "@/lib/i18n/context";
import { fmtDate } from "@/lib/utils";
import { formatMoney, type CurrencyCode } from "@/lib/currency";
import { Plus, Search, ShoppingCart } from "lucide-react";

interface Row {
  id: string; code: string; supplierName: string; status: string;
  currency: string; issueDate: string; expectedDate: string | null;
  total: number; itemCount: number; createdBy: string;
}

const STATUSES = ["DRAFT", "SENT", "PARTIAL", "RECEIVED", "CANCELLED"];

const STATUS_CLS: Record<string, string> = {
  DRAFT:     "bg-slate-100 text-slate-700",
  SENT:      "bg-cyan-100 text-cyan-700",
  PARTIAL:   "bg-amber-100 text-amber-700",
  RECEIVED:  "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-rose-100 text-rose-700"
};

export function POList({ initial }: { initial: Row[] }) {
  const { t, locale } = useI18n();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const rows = useMemo(() => {
    const ql = q.toLowerCase();
    return initial.filter((r) => {
      if (status && r.status !== status) return false;
      if (!ql) return true;
      return r.code.toLowerCase().includes(ql) || r.supplierName.toLowerCase().includes(ql);
    });
  }, [initial, q, status]);

  const totalOpen = initial.filter((r) => r.status === "SENT" || r.status === "PARTIAL").reduce((s, r) => s + r.total, 0);

  return (
    <div>
      <PageHeader
        title={t("po.title")}
        breadcrumb={[{ label: t("nav.dashboard"), href: "/dashboard" }, { label: t("po.title") }]}
        action={
          <Button asChild size="lg">
            <Link href="/purchase-orders/new"><Plus className="h-5 w-5" /> {t("po.new")}</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total POs</p>
          <p className="text-2xl font-bold">{initial.length}</p>
        </Card>
        <Card className="p-4 bg-cyan-50 dark:bg-cyan-900/20">
          <p className="text-xs text-cyan-700 dark:text-cyan-300">Open (Sent + Partial)</p>
          <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">{initial.filter(r => r.status === "SENT" || r.status === "PARTIAL").length}</p>
        </Card>
        <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/20">
          <p className="text-xs text-emerald-700 dark:text-emerald-300">Received</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{initial.filter(r => r.status === "RECEIVED").length}</p>
        </Card>
        <Card className="p-4 bg-amber-50 dark:bg-amber-900/20">
          <p className="text-xs text-amber-700 dark:text-amber-300">Open value</p>
          <p className="text-xl font-bold text-amber-700 dark:text-amber-300">
            {initial[0] ? formatMoney(totalOpen, initial[0].currency as CurrencyCode, locale) : "—"}
          </p>
        </Card>
      </div>

      <Card className="p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:max-w-[200px]">
            <option value="">{t("common.status")}</option>
            {STATUSES.map((s) => <option key={s} value={s}>{t(`po.status.${s}`)}</option>)}
          </Select>
        </div>
      </Card>

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            title={t("common.noData")}
            description={`Create a Purchase Order to send to your supplier.`}
            action={<Button asChild><Link href="/purchase-orders/new"><ShoppingCart className="h-4 w-4" /> {t("po.new")}</Link></Button>}
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{t("po.code")}</TH>
                <TH>{t("po.supplier")}</TH>
                <TH>{t("po.issueDate")}</TH>
                <TH>{t("po.expectedDate")}</TH>
                <TH className="text-right">Items</TH>
                <TH className="text-right">{t("common.total")}</TH>
                <TH>{t("common.status")}</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((r) => (
                <TR key={r.id}>
                  <TD className="font-mono text-xs">
                    <Link href={`/purchase-orders/${r.id}`} className="text-primary hover:underline">{r.code}</Link>
                  </TD>
                  <TD className="font-medium">{r.supplierName}</TD>
                  <TD className="text-xs text-muted-foreground">{fmtDate(r.issueDate)}</TD>
                  <TD className="text-xs">{fmtDate(r.expectedDate)}</TD>
                  <TD className="text-right">{r.itemCount}</TD>
                  <TD className="text-right font-medium">{formatMoney(r.total, r.currency as CurrencyCode, locale)}</TD>
                  <TD>
                    <Badge className={STATUS_CLS[r.status] ?? "bg-slate-100 text-slate-700"}>
                      {t(`po.status.${r.status}`)}
                    </Badge>
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
