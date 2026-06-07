import { prisma } from "@/lib/prisma";
import { NewMRForm } from "./form.client";

export const dynamic = "force-dynamic";

export default async function NewMRPage({ searchParams }: { searchParams: { jobId?: string } }) {
  const [jobs, materials] = await Promise.all([
    prisma.job.findMany({
      where: { status: { in: ["NEW", "CONFIRMED", "DESIGN", "WAITING_MATERIAL", "PRODUCTION", "QC", "REWORK"] } },
      include: { customer: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.material.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <NewMRForm
      jobs={jobs.map((j) => ({ id: j.id, code: j.code, customer: j.customer.name, status: j.status }))}
      materials={materials.map((m) => ({
        id: m.id, code: m.code, name: m.name, unit: m.unit,
        stockQty: Number(m.stockQty), unitCost: Number(m.unitCost), currency: m.currency
      }))}
      initialJobId={searchParams.jobId}
    />
  );
}
