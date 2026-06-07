import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MaterialDetail } from "./detail.client";

export const dynamic = "force-dynamic";

export default async function MaterialDetailPage({ params }: { params: { id: string } }) {
  const m = await prisma.material.findUnique({
    where: { id: params.id },
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 50, include: { job: true } } }
  });
  if (!m) notFound();

  return (
    <MaterialDetail
      material={{
        id: m.id, code: m.code, name: m.name, category: m.category, unit: m.unit,
        unitCost: Number(m.unitCost), stockQty: Number(m.stockQty), reorderLevel: Number(m.reorderLevel),
        currency: m.currency,
        transactions: m.transactions.map((t) => ({
          id: t.id, type: t.type, quantity: Number(t.quantity), unit: t.unit,
          unitCost: t.unitCost ? Number(t.unitCost) : null,
          jobCode: t.job?.code ?? null, note: t.note, createdAt: t.createdAt.toISOString()
        }))
      }}
    />
  );
}
