import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { QuotationsListClient } from "./list.client";

export const dynamic = "force-dynamic";

export default async function QuotationsPage() {
  const quotations = await prisma.quotation.findMany({
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: 200
  });
  return (
    <QuotationsListClient
      initial={quotations.map((q) => ({
        id: q.id,
        code: q.code,
        customer: q.customer?.name ?? "—",
        issueDate: q.issueDate.toISOString(),
        total: Number(q.total),
        currency: q.currency,
        status: q.status
      }))}
    />
  );
}
