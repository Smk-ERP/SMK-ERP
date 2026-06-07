import { prisma } from "@/lib/prisma";
import { QCForm } from "./form.client";

export const dynamic = "force-dynamic";

export default async function NewQCPage({ searchParams }: { searchParams: { jobId?: string } }) {
  const jobs = await prisma.job.findMany({
    where: { status: { in: ["QC", "PRODUCTION", "REWORK"] } },
    include: { customer: true },
    orderBy: { dueDate: "asc" }
  });

  return (
    <QCForm
      jobs={jobs.map((j) => ({ id: j.id, code: j.code, customer: j.customer.name, status: j.status }))}
      initialJobId={searchParams.jobId}
    />
  );
}
