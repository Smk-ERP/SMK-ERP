import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MRDetail } from "./detail.client";

export const dynamic = "force-dynamic";

export default async function MRDetailPage({ params }: { params: { id: string } }) {
  const mr = await prisma.materialRequest.findUnique({
    where: { id: params.id },
    include: {
      job: { include: { customer: true } },
      requestedBy: true,
      items: { include: { material: true } }
    }
  });
  if (!mr) notFound();

  return (
    <MRDetail
      mr={{
        id: mr.id,
        code: mr.code,
        status: mr.status,
        note: mr.note,
        createdAt: mr.createdAt.toISOString(),
        job: { id: mr.job.id, code: mr.job.code, customer: mr.job.customer.name, status: mr.job.status },
        requester: mr.requestedBy.fullName,
        items: mr.items.map((it) => ({
          id: it.id,
          material: { code: it.material.code, name: it.material.name, stockQty: Number(it.material.stockQty) },
          quantity: Number(it.quantity),
          unit: it.unit
        }))
      }}
    />
  );
}
