import { prisma } from "@/lib/prisma";
import { NewFinanceDoc } from "./form.client";

export const dynamic = "force-dynamic";

export default async function NewFinanceDocPage({ searchParams }: { searchParams: { jobId?: string; quotationId?: string; type?: string } }) {
  const [quotations, jobs, customers] = await Promise.all([
    prisma.quotation.findMany({
      where: { status: { in: ["APPROVED", "CONVERTED"] } },
      include: { customer: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.job.findMany({
      include: { customer: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <NewFinanceDoc
      quotations={quotations.map((q) => ({
        id: q.id, code: q.code, customer: q.customer.name, customerId: q.customerId,
        total: Number(q.total), currency: q.currency
      }))}
      jobs={jobs.map((j) => ({ id: j.id, code: j.code, customer: j.customer.name }))}
      customers={customers.map((c) => ({ id: c.id, name: c.name, code: c.code }))}
      initial={searchParams}
    />
  );
}
