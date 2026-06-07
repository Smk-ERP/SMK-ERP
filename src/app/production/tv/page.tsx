import { prisma } from "@/lib/prisma";
import { TvView } from "./tv.client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TvPage() {
  const jobs = await prisma.job.findMany({
    where: {
      status: {
        in: ["NEW", "CONFIRMED", "DESIGN", "WAITING_MATERIAL", "PRODUCTION", "QC", "REWORK", "READY_TO_INSTALL"]
      }
    },
    include: { customer: true, assignedTo: true },
    orderBy: { dueDate: "asc" }
  });

  return (
    <TvView
      jobs={jobs.map((j) => ({
        id: j.id, code: j.code, status: j.status, team: j.team,
        customer: j.customer.name, assignee: j.assignedTo?.fullName ?? null,
        dueDate: j.dueDate ? j.dueDate.toISOString() : null
      }))}
    />
  );
}
