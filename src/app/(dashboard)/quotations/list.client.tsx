"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney, type CurrencyCode } from "@/lib/currency";
import { Plus, Search } from "lucide-react";
import { fmtDate } from "@/lib/utils";

interface Row {
  id: string;
  code: string;
  customer: string;
  issueDate: string;
  total: number;
  currency: string;
  status: string;
}

export function QuotationsListClient({ initial }: { initial: Row[] }) {
  const { t, locale } = useI18n();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const rows = useMemo(() => {
    const ql = q.toLowerCase();
    return initial.filter((r) => {
      if (status && r.status !== status) return false;
      if (!ql) return true;
      return r.code.toLowerCase().includes(ql) || r.customer.toLowerCase().includes(ql);
    });
  }, [initial, q, status]);

  return (
    <div>
      <PageHeader
        title={t("quotation.title")}
        breadcrumb={[{ label: t("nav.dashboard"), href: "/dashboard" }, { label: t("quotation.title") }]}
        action={<Button asChild size="lg"><Link href="/quotations/new"><Plus className="h-5 w-5" /> {t("quotation.new")}</Link></Button>}
      />

      <Card className="p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:max-w-xs">
            <option value="">{t("common.status")}</option>
            {["DRAFT","SENT","APPROVED","REJECTED","CONVERTED","EXPIRED"].map((s) => (
              <option key={s} value={s}>{t(`quotation.status.${s}`)}</option>
            ))}
          </Select>
        </div>
      </Card>

      <Card>
        {rows.length === 0 ? (
          <EmptyState title={t("common.noData")} action={<Button asChild><Link href="/quotations/new">{t("quotation.new")}</Link></Button>} />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{t("quotation.code")}</TH>
                <TH>{t("quotation.customer")}</TH>
                <TH>{t("quotation.issueDate")}</TH>
                <TH className="text-right">{t("common.total")}</TH>
                <TH>{t("common.status")}</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((r) => (
                <TR key={r.id}>
                  <TD className="font-mono text-xs">
                    <Link href={`/quotations/${r.id}`} className="text-primary hover:underline">{r.code}</Link>
                  </TD>
                  <TD>{r.customer}</TD>
                  <TD className="text-xs text-muted-foreground">{fmtDate(r.issueDate)}</TD>
                  <TD className="text-right font-medium">{formatMoney(r.total, r.currency as CurrencyCode, locale)}</TD>
                  <TD><StatusBadge status={r.status} label={t(`quotation.status.${r.status}`)} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
