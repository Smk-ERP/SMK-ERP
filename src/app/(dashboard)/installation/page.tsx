import { prisma } from "@/lib/prisma";
import { InstallationList } from "./list.client";

export const dynamic = "force-dynamic";

export default async function InstallationPage() {
  const installations = await prisma.installation.findMany({
    include: { job: { include: { customer: true } }, owner: true },
    orderBy: { scheduledAt: "desc" }
  });

  const readyJobs = await prisma.job.findMany({
    where: { status: "READY_TO_INSTALL" },
    include: { customer: true },
    orderBy: { dueDate: "asc" }
  });

  return (
    <InstallationList
      installations={installations.map((i) => ({
        id: i.id,
        status: i.status,
        scheduledAt: i.scheduledAt ? i.scheduledAt.toISOString() : null,
        completedAt: i.completedAt ? i.completedAt.toISOString() : null,
        job: { id: i.job.id, code: i.job.code, customer: i.job.customer.name },
        owner: i.owner.fullName,
        note: i.note
      }))}
      readyJobs={readyJobs.map((j) => ({
        id: j.id, code: j.code, customer: j.customer.name,
        dueDate: j.dueDate ? j.dueDate.toISOString() : null
      }))}
    />
  );
}
