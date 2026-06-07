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
import { Plus, Search } from "lucide-react";

interface Row {
  id: string; code: string; docType: string;
  currency: string; issueDate: string; paidAt: string | null;
  amount: number; total: number; paid: number; balance: number;
  customer: string;
}

const TYPES = ["BILLING_NOTE", "INVOICE", "RECEIPT", "PAYMENT_SLIP", "DELIVERY_NOTE", "INSTALLATION_REPORT"];

export function FinanceList({ initial }: { initial: Row[] }) {
  const { t, locale } = useI18n();
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [paid, setPaid] = useState("");

  const rows = useMemo(() => {
    const ql = q.toLowerCase();
    return initial.filter((r) => {
      if (type && r.docType !== type) return false;
      if (paid === "paid" && !r.paidAt) return false;
      if (paid === "unpaid" && r.paidAt) return false;
      if (!ql) return true;
      return r.code.toLowerCase().includes(ql) || r.customer.toLowerCase().includes(ql);
    });
  }, [initial, q, type, paid]);

  const totalUnpaid = initial.filter((r) => !r.paidAt).reduce((s, r) => s + r.balance, 0);

  return (
    <div>
      <PageHeader
        title={t("finance.title")}
        breadcrumb={[{ label: t("nav.dashboard"), href: "/dashboard" }, { label: t("finance.title") }]}
        action={
          <Button asChild size="lg">
            <Link href="/finance/new"><Plus className="h-5 w-5" /> {t("finance.newDoc")}</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total docs</p>
          <p className="text-2xl font-bold">{initial.length}</p>
        </Card>
        <Card className="p-4 bg-emerald-50">
          <p className="text-xs text-emerald-700">{t("finance.paid")}</p>
          <p className="text-2xl font-bold text-emerald-700">{initial.filter((r) => r.paidAt).length}</p>
        </Card>
        <Card className="p-4 bg-amber-50">
          <p className="text-xs text-amber-700">{t("finance.unpaid")}</p>
          <p className="text-2xl font-bold text-amber-700">{initial.filter((r) => !r.paidAt).length}</p>
        </Card>
        <Card className="p-4 bg-rose-50">
          <p className="text-xs text-rose-700">Outstanding</p>
          <p className="text-xl font-bold text-rose-700">
            {initial[0] ? formatMoney(totalUnpaid, initial[0].currency as CurrencyCode, locale) : "—"}
          </p>
        </Card>
      </div>

      <Card className="p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={type} onChange={(e) => setType(e.target.value)} className="sm:max-w-[200px]">
            <option value="">{t("finance.type")}</option>
            {TYPES.map((tt) => <option key={tt} value={tt}>{t(`finance.docTypes.${tt}`)}</option>)}
          </Select>
          <Select value={paid} onChange={(e) => setPaid(e.target.value)} className="sm:max-w-[150px]">
            <option value="">All</option>
            <option value="paid">{t("finance.paid")}</option>
            <option value="unpaid">{t("finance.unpaid")}</option>
          </Select>
        </div>
      </Card>

      <Card>
        {rows.length === 0 ? (
          <EmptyState title={t("common.noData")} action={<Button asChild><Link href="/finance/new">{t("finance.newDoc")}</Link></Button>} />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{t("finance.code")}</TH>
                <TH>{t("finance.type")}</TH>
                <TH>{t("quotation.customer")}</TH>
                <TH>{t("finance.issueDate")}</TH>
                <TH className="text-right">{t("common.total")}</TH>
                <TH className="text-right">{t("finance.balance")}</TH>
                <TH>{t("common.status")}</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((r) => (
                <TR key={r.id}>
                  <TD className="font-mono text-xs"><Link href={`/finance/${r.id}`} className="text-primary hover:underline">{r.code}</Link></TD>
                  <TD><Badge variant="muted">{t(`finance.docTypes.${r.docType}`)}</Badge></TD>
                  <TD>{r.customer}</TD>
                  <TD className="text-xs">{fmtDate(r.issueDate)}</TD>
                  <TD className="text-right font-medium">{formatMoney(r.total, r.currency as CurrencyCode, locale)}</TD>
                  <TD className="text-right">
                    {r.balance > 0
                      ? <span className="text-rose-600 font-medium">{formatMoney(r.balance, r.currency as CurrencyCode, locale)}</span>
                      : <span className="text-emerald-600">—</span>}
                  </TD>
                  <TD>
                    {r.paidAt
                      ? <Badge className="bg-emerald-100 text-emerald-700">{t("finance.paid")}</Badge>
                      : <Badge className="bg-amber-100 text-amber-700">{t("finance.unpaid")}</Badge>}
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
