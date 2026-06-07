import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { FileText, Briefcase, Phone, Mail, MessageCircle } from "lucide-react";
import { fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      quotations: { orderBy: { createdAt: "desc" } },
      jobs: { orderBy: { createdAt: "desc" } }
    }
  });
  if (!customer) notFound();

  return (
    <div>
      <PageHeader
        title={customer.name}
        subtitle={customer.code}
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Customers", href: "/customers" },
          { label: customer.name }
        ]}
        action={
          <>
            <Button asChild variant="outline">
              <Link href={`/quotations/new?customerId=${customer.id}`}>
                <FileText className="h-4 w-4" /> New Quotation
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><Badge variant="muted">{customer.type}</Badge></div>
            {customer.companyName && <div><span className="text-muted-foreground">Company:</span> {customer.companyName}</div>}
            {customer.phone && <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{customer.phone}</div>}
            {customer.email && <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{customer.email}</div>}
            {customer.whatsapp && <div className="flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5" />WA: {customer.whatsapp}</div>}
            {customer.facebook && <div>FB: {customer.facebook}</div>}
            {customer.tiktok && <div>TT: {customer.tiktok}</div>}
            {customer.address && <div className="pt-2 text-muted-foreground">{customer.address}</div>}
            {customer.note && <div className="pt-2 italic text-muted-foreground">{customer.note}</div>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Quotation history</CardTitle></CardHeader>
          <CardContent>
            {customer.quotations.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : (
              <Table>
                <THead><TR><TH>Code</TH><TH>Date</TH><TH>Total</TH><TH>Status</TH></TR></THead>
                <TBody>
                  {customer.quotations.map((q) => (
                    <TR key={q.id}>
                      <TD className="font-mono"><Link href={`/quotations/${q.id}`} className="text-primary">{q.code}</Link></TD>
                      <TD>{fmtDate(q.issueDate)}</TD>
                      <TD>{Number(q.total).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} {q.currency}</TD>
                      <TD><StatusBadge status={q.status} /></TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle><Briefcase className="inline h-4 w-4 mr-2" />Job history</CardTitle></CardHeader>
        <CardContent>
          {customer.jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <Table>
              <THead><TR><TH>Code</TH><TH>Status</TH><TH>Due</TH></TR></THead>
              <TBody>
                {customer.jobs.map((j) => (
                  <TR key={j.id}>
                    <TD className="font-mono"><Link href={`/jobs/${j.id}`} className="text-primary">{j.code}</Link></TD>
                    <TD><StatusBadge status={j.status} /></TD>
                    <TD>{fmtDate(j.dueDate)}</TD>
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
