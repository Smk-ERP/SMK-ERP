"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { useI18n } from "@/lib/i18n/context";
import { Plus, Search, Phone, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fmtDate } from "@/lib/utils";

interface CustomerRow {
  id: string;
  code: string;
  name: string;
  type: string;
  companyName?: string | null;
  phone?: string | null;
  email?: string | null;
  createdAt: string;
}

export function CustomersClient({ initialCustomers }: { initialCustomers: CustomerRow[] }) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [type, setType] = useState("");

  const rows = useMemo(() => {
    const ql = q.toLowerCase();
    return initialCustomers.filter((c) => {
      if (type && c.type !== type) return false;
      if (!ql) return true;
      return (
        c.name.toLowerCase().includes(ql) ||
        c.code.toLowerCase().includes(ql) ||
        (c.companyName ?? "").toLowerCase().includes(ql) ||
        (c.phone ?? "").includes(ql)
      );
    });
  }, [initialCustomers, q, type]);

  return (
    <div>
      <PageHeader
        title={t("customer.title")}
        breadcrumb={[{ label: t("nav.dashboard"), href: "/dashboard" }, { label: t("customer.title") }]}
        action={
          <Button asChild size="lg">
            <Link href="/customers/new"><Plus className="h-5 w-5" /> {t("customer.newCustomer")}</Link>
          </Button>
        }
      />

      <Card className="p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={type} onChange={(e) => setType(e.target.value)} className="sm:max-w-xs">
            <option value="">{t("common.filter")} — {t("customer.type")}</option>
            {["WALK_IN", "RETURNING", "FACEBOOK", "WHATSAPP", "TIKTOK", "REFERRAL", "CORPORATE", "OTHER"].map((tt) => (
              <option key={tt} value={tt}>{t(`customer.types.${tt}`)}</option>
            ))}
          </Select>
        </div>
      </Card>

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            title={t("common.noData")}
            action={<Button asChild><Link href="/customers/new">{t("customer.newCustomer")}</Link></Button>}
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Code</TH>
                <TH>{t("customer.name")}</TH>
                <TH>{t("customer.type")}</TH>
                <TH>{t("customer.phone")}</TH>
                <TH>Email</TH>
                <TH>{t("common.date")}</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((c) => (
                <TR key={c.id}>
                  <TD className="font-mono text-xs">
                    <Link href={`/customers/${c.id}`} className="text-primary hover:underline">{c.code}</Link>
                  </TD>
                  <TD>
                    <Link href={`/customers/${c.id}`} className="font-medium hover:underline">{c.name}</Link>
                    {c.companyName && <div className="text-xs text-muted-foreground">{c.companyName}</div>}
                  </TD>
                  <TD><Badge variant="muted">{t(`customer.types.${c.type}`)}</Badge></TD>
                  <TD>{c.phone ? <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{c.phone}</span> : "—"}</TD>
                  <TD>{c.email ? <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{c.email}</span> : "—"}</TD>
                  <TD className="text-xs text-muted-foreground">{fmtDate(c.createdAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
