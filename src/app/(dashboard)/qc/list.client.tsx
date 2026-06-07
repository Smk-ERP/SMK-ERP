"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useI18n } from "@/lib/i18n/context";
import { fmtDate } from "@/lib/utils";
import { ClipboardCheck, AlertCircle } from "lucide-react";

interface Pending { id: string; code: string; customer: string; dueDate: string | null }
interface Hist { id: string; jobCode: string; jobId: string; customer: string; result: string; inspector: string; reworkResolved: boolean | null; createdAt: string }

export function QCListClient({ pending, history }: { pending: Pending[]; history: Hist[] }) {
  const { t } = useI18n();
  return (
    <div>
      <PageHeader
        title={t("qc.title")}
        breadcrumb={[{ label: t("nav.dashboard"), href: "/dashboard" }, { label: t("qc.title") }]}
      />

      <Card className="mb-4">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle><AlertCircle className="inline h-5 w-5 mr-2 text-amber-600" />Pending QC ({pending.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <EmptyState title="No jobs waiting QC" description="Jobs with status QC will appear here." />
          ) : (
            <Table>
              <THead><TR><TH>{t("job.code")}</TH><TH>{t("quotation.customer")}</TH><TH>{t("job.dueDate")}</TH><TH></TH></TR></THead>
              <TBody>
                {pending.map((j) => (
                  <TR key={j.id}>
                    <TD className="font-mono text-xs">{j.code}</TD>
                    <TD>{j.customer}</TD>
                    <TD className="text-xs">{fmtDate(j.dueDate)}</TD>
                    <TD className="text-right">
                      <Button asChild size="sm">
                        <Link href={`/qc/new?jobId=${j.id}`}><ClipboardCheck className="h-4 w-4" /> {t("qc.newCheck")}</Link>
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("qc.title")} {t("common.actions")}</CardTitle></CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">—</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>{t("common.date")}</TH>
                  <TH>{t("job.code")}</TH>
                  <TH>{t("quotation.customer")}</TH>
                  <TH>{t("qc.result")}</TH>
                  <TH>Inspector</TH>
                  <TH>Rework</TH>
                </TR>
              </THead>
              <TBody>
                {history.map((h) => (
                  <TR key={h.id}>
                    <TD className="text-xs text-muted-foreground">{fmtDate(h.createdAt)}</TD>
                    <TD className="font-mono text-xs"><Link href={`/jobs/${h.jobId}`} className="text-primary hover:underline">{h.jobCode}</Link></TD>
                    <TD>{h.customer}</TD>
                    <TD>
                      {h.result === "PASS" ? <Badge className="bg-emerald-100 text-emerald-700">{t("qc.pass")}</Badge> : <Badge className="bg-rose-100 text-rose-700">{t("qc.fail")}</Badge>}
                    </TD>
                    <TD className="text-xs">{h.inspector}</TD>
                    <TD>{h.reworkResolved === null ? "—" : h.reworkResolved ? <Badge className="bg-emerald-100 text-emerald-700">resolved</Badge> : <Badge className="bg-amber-100 text-amber-800">pending</Badge>}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
