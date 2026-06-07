import { prisma } from "@/lib/prisma";
import { NewPOForm } from "./form.client";

export const dynamic = "force-dynamic";

export default async function NewPOPage({ searchParams }: { searchParams: { materialRequestId?: string; jobId?: string } }) {
  const materials = await prisma.material.findMany({ orderBy: { name: "asc" } });

  // If created from a material request, pre-fill items from it
  let prefillItems: { description: string; quantity: number; unit: string; materialId?: string }[] = [];
  if (searchParams.materialRequestId) {
    const mr = await prisma.materialRequest.findUnique({
      where: { id: searchParams.materialRequestId },
      include: { items: { include: { material: true } } }
    });
    if (mr) {
      prefillItems = mr.items.map((it) => ({
        materialId: it.material.id,
        description: `${it.material.code} — ${it.material.name}`,
        quantity: Number(it.quantity),
        unit: it.unit
      }));
    }
  }

  return (
    <NewPOForm
      materials={materials.map((m) => ({
        id: m.id, code: m.code, name: m.name, unit: m.unit,
        unitCost: Number(m.unitCost), currency: m.currency
      }))}
      prefillItems={prefillItems}
      jobId={searchParams.jobId}
      materialRequestId={searchParams.materialRequestId}
    />
  );
}
