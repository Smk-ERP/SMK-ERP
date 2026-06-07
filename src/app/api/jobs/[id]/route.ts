import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      quotation: { include: { items: true } },
      assignedTo: true,
      statusHistory: { include: { changedBy: true }, orderBy: { changedAt: "desc" } }
    }
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ job });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json();
  const allowed = ["assignedToId", "team", "priority", "dueDate", "productionNote", "installNote", "internalNote", "customerOk", "customerOkAt"];
  const update: any = {};
  for (const k of allowed) if (k in data) update[k] = data[k];
  if (update.dueDate) update.dueDate = new Date(update.dueDate);
  const job = await prisma.job.update({ where: { id: params.id }, data: update });
  return NextResponse.json({ job });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  // Cascade delete the job's status history and attachments; orphan inventory transactions are kept for audit.
  await prisma.jobStatusHistory.deleteMany({ where: { jobId: params.id } });
  await prisma.jobAttachment.deleteMany({ where: { jobId: params.id } });
  await prisma.materialRequest.deleteMany({ where: { jobId: params.id } });
  // Clear quotation linkage so the quotation row remains
  await prisma.job.update({ where: { id: params.id }, data: { quotationId: null } }).catch(() => {});
  await prisma.job.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
