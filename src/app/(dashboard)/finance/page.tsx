import { prisma } from "@/lib/prisma";
import { FinanceList } from "./list.client";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const docs = await prisma.financeDocument.findMany({
    include: { createdBy: true, payments: true },
    orderBy: { issuedAt: "desc" },
    take: 200
  });
  const customerIds = Array.from(new Set(docs.map((d) => d.customerId).filter(Boolean) as string[]));
  const customers = await prisma.customer.findMany({ where: { id: { in: customerIds } } });
  const cMap = new Map(customers.map((c) => [c.id, c.name]));

  return (
    <FinanceList
      initial={docs.map((d) => {
        const paid = d.payments.reduce((s, p) => s + Number(p.amount), 0);
        return {
          id: d.id, code: d.code, docType: d.docType,
          currency: d.currency,
          issueDate: d.issuedAt.toISOString(),
          paidAt: d.paidAt ? d.paidAt.toISOString() : null,
          amount: Number(d.amount), total: Number(d.total), paid,
          balance: Math.max(0, Number(d.total) - paid),
          customer: d.customerId ? cMap.get(d.customerId) ?? "—" : "—"
        };
      })}
    />
  );
}
