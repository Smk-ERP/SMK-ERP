import { prisma } from "@/lib/prisma";
import { JobsListClient } from "./list.client";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const jobs = await prisma.job.findMany({
    include: { customer: true, assignedTo: true, quotation: true },
    orderBy: { createdAt: "desc" },
    take: 200
  });
  return (
    <JobsListClient
      initial={jobs.map((j) => ({
        id: j.id,
        code: j.code,
        customer: j.customer?.name ?? "—",
        quotationCode: j.quotation?.code ?? null,
        assignee: j.assignedTo?.fullName ?? null,
        dueDate: j.dueDate ? j.dueDate.toISOString() : null,
        status: j.status
      }))}
    />
  );
}
