import { prisma } from "@/lib/prisma";
import { InventoryList } from "./list.client";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const mats = await prisma.material.findMany({ orderBy: { name: "asc" } });
  return (
    <InventoryList
      initial={mats.map((m) => ({
        id: m.id,
        code: m.code,
        name: m.name,
        category: m.category,
        unit: m.unit,
        unitCost: Number(m.unitCost),
        stockQty: Number(m.stockQty),
        reorderLevel: Number(m.reorderLevel),
        currency: m.currency,
        isLow: Number(m.stockQty) <= Number(m.reorderLevel)
      }))}
    />
  );
}
