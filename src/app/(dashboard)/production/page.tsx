import { prisma } from "@/lib/prisma";
import { ProductionBoard } from "./board.client";

export const dynamic = "force-dynamic";

export default async function ProductionPage() {
  const jobs = await prisma.job.findMany({
    where: {
      status: {
        in: ["NEW", "CONFIRMED", "DESIGN", "WAITING_MATERIAL", "PRODUCTION", "QC", "REWORK", "READY_TO_INSTALL"]
      }
    },
    include: {
      customer: true,
      assignedTo: true,
      quotation: { include: { items: true } },
      materialReqs: { where: { status: { in: ["REQUESTED", "APPROVED"] } } },
      qcChecks: { include: { result: true }, orderBy: { createdAt: "desc" }, take: 1 },
      attachments: { include: { fileAsset: true }, take: 1, orderBy: { createdAt: "desc" } }
    },
    orderBy: { dueDate: "asc" }
  });

  return (
    <ProductionBoard
      jobs={jobs.map((j) => ({
        id: j.id,
        code: j.code,
        status: j.status,
        priority: j.priority,
        team: j.team,
        customer: j.customer.name,
        assignee: j.assignedTo?.fullName ?? null,
        dueDate: j.dueDate ? j.dueDate.toISOString() : null,
        productionNote: j.productionNote,
        signTypes: j.quotation ? Array.from(new Set(j.quotation.items.map((it) => it.signType))) : [],
        itemCount: j.quotation?.items.length ?? 0,
        quotationCode: j.quotation?.code ?? null,
        quotationTotal: j.quotation ? Number(j.quotation.total) : 0,
        currency: j.quotation?.currency ?? "LAK",
        pendingMR: j.materialReqs.length,
        lastQC: j.qcChecks[0]?.result?.status ?? null,
        thumbUrl: j.attachments[0]?.fileAsset.url ?? null,
        thumbIsImage: !!j.attachments[0]?.fileAsset.mimeType?.startsWith("image/")
      }))}
    />
  );
}
