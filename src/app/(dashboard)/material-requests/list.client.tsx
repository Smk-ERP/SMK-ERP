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
import { fmtDate } from "@/lib/utils";
import { Plus, Search } from "lucide-react";

interface Row {
  id: string; code: string; status: string;
  job: { code: string; customer: string };
  requester: string; itemCount: number; createdAt: string;
}

const STATUSES = ["REQUESTED", "APPROVED", "ISSUED", "REJECTED"];
const STATUS_TO_BADGE: Record<string, string> = {
  REQUESTED: "DRAFT", APPROVED: "APPROVED", ISSUED: "CONVERTED", REJECTED: "REJECTED"
};

export function MaterialRequestList({ initial }: { initial: Row[] }) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const rows = useMemo(() => {
    const ql = q.toLowerCase();
    return initial.filter((r) => {
      if (status && r.status !== status) return false;
      if (!ql) return true;
      return r.code.toLowerCase().includes(ql) || r.job.code.toLowerCase().includes(ql) ||
             r.job.customer.toLowerCase().includes(ql);
    });
  }, [initial, q, status]);

  return (
    <div>
      <PageHeader
        title={t("materialRequest.title")}
        breadcrumb={[{ label: t("nav.dashboard"), href: "/dashboard" }, { label: t("materialRequest.title") }]}
        action={<Button asChild size="lg"><Link href="/material-requests/new"><Plus className="h-5 w-5" /> {t("materialRequest.new")}</Link></Button>}
      />

      <Card className="p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:max-w-xs">
            <option value="">{t("common.status")}</option>
            {STATUSES.map((s) => <option key={s} value={s}>{t(`materialRequest.status.${s}`)}</option>)}
          </Select>
        </div>
      </Card>

      <Card>
        {rows.length === 0 ? (
          <EmptyState title={t("common.noData")} action={<Button asChild><Link href="/material-requests/new">{t("materialRequest.new")}</Link></Button>} />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{t("materialRequest.code")}</TH>
                <TH>{t("materialRequest.job")}</TH>
                <TH>{t("quotation.customer")}</TH>
                <TH>{t("materialRequest.requester")}</TH>
                <TH className="text-right">Items</TH>
                <TH>{t("common.date")}</TH>
                <TH>{t("common.status")}</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((r) => (
                <TR key={r.id}>
                  <TD className="font-mono text-xs"><Link href={`/material-requests/${r.id}`} className="text-primary hover:underline">{r.code}</Link></TD>
                  <TD className="font-mono text-xs">{r.job.code}</TD>
                  <TD>{r.job.customer}</TD>
                  <TD className="text-xs">{r.requester}</TD>
                  <TD className="text-right">{r.itemCount}</TD>
                  <TD className="text-xs text-muted-foreground">{fmtDate(r.createdAt)}</TD>
                  <TD><StatusBadge status={STATUS_TO_BADGE[r.status]} label={t(`materialRequest.status.${r.status}`)} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
