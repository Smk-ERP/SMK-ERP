import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MaterialRequestList } from "./list.client";

export const dynamic = "force-dynamic";

export default async function MaterialRequestsPage() {
  const rows = await prisma.materialRequest.findMany({
    include: {
      job: { include: { customer: true } },
      requestedBy: true,
      items: true
    },
    orderBy: { createdAt: "desc" },
    take: 200
  });

  return (
    <MaterialRequestList
      initial={rows.map((r) => ({
        id: r.id, code: r.code, status: r.status,
        job: { code: r.job.code, customer: r.job.customer.name },
        requester: r.requestedBy.fullName,
        itemCount: r.items.length,
        createdAt: r.createdAt.toISOString()
      }))}
    />
  );
}
