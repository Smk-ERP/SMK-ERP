import { prisma } from "@/lib/prisma";
import { POList } from "./list.client";

export const dynamic = "force-dynamic";

export default async function PurchaseOrdersPage() {
  const orders = await prisma.purchaseOrder.findMany({
    include: { items: true, createdBy: true },
    orderBy: { createdAt: "desc" },
    take: 200
  });
  return (
    <POList
      initial={orders.map((o) => ({
        id: o.id,
        code: o.code,
        supplierName: o.supplierName,
        status: o.status,
        currency: o.currency,
        issueDate: o.issueDate.toISOString(),
        expectedDate: o.expectedDate ? o.expectedDate.toISOString() : null,
        total: Number(o.total),
        itemCount: o.items.length,
        createdBy: o.createdBy.fullName
      }))}
    />
  );
}
