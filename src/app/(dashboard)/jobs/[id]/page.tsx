import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { JobDetail } from "./detail.client";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      quotation: { include: { items: true } },
      assignedTo: true,
      statusHistory: { include: { changedBy: true }, orderBy: { changedAt: "desc" } }
    }
  });
  if (!job) notFound();

  const dto = {
    id: job.id,
    code: job.code,
    status: job.status,
    priority: job.priority,
    team: job.team,
    dueDate: job.dueDate ? job.dueDate.toISOString() : null,
    productionNote: job.productionNote,
    installNote: job.installNote,
    internalNote: job.internalNote,
    customerOk: job.customerOk,
    customer: { id: job.customer.id, name: job.customer.name, code: job.customer.code, phone: job.customer.phone },
    quotation: job.quotation
      ? {
          id: job.quotation.id,
          code: job.quotation.code,
          total: Number(job.quotation.total),
          currency: job.quotation.currency,
          itemCount: job.quotation.items.length,
          signTypes: Array.from(new Set(job.quotation.items.map((it) => it.signType)))
        }
      : null,
    assignee: job.assignedTo ? { id: job.assignedTo.id, name: job.assignedTo.fullName } : null,
    history: job.statusHistory.map((h) => ({
      id: h.id,
      from: h.fromStatus,
      to: h.toStatus,
      by: h.changedBy?.fullName ?? "system",
      at: h.changedAt.toISOString(),
      note: h.note
    }))
  };

  return <JobDetail job={dto} />;
}
