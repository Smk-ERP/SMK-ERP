import { prisma } from "@/lib/prisma";
import { QuotationBuilder } from "./builder.client";

export const dynamic = "force-dynamic";

export default async function NewQuotationPage({ searchParams }: { searchParams: { customerId?: string } }) {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true, companyName: true }
  });
  return <QuotationBuilder customers={customers} initialCustomerId={searchParams.customerId} />;
}
