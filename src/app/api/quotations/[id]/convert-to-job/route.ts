import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { nextJobCode } from "@/lib/codes";
import { notify, usersByRoles } from "@/lib/notify";

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quotation = await prisma.quotation.findUnique({
    where: { id: params.id },
    include: { job: true }
  });
  if (!quotation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (quotation.job) return NextResponse.json({ error: "Already converted", jobId: quotation.job.id }, { status: 409 });
  if (quotation.status !== "APPROVED") {
    return NextResponse.json({ error: "Quotation must be APPROVED" }, { status: 400 });
  }

  const jobCode = await nextJobCode();
  const job = await prisma.job.create({
    data: {
      code: jobCode,
      quotationId: quotation.id,
      customerId: quotation.customerId,
      status: "NEW",
      statusHistory: {
        create: { toStatus: "NEW", changedById: user.id, note: "Created from quotation" }
      }
    }
  });

  await prisma.quotation.update({
    where: { id: quotation.id },
    data: { status: "CONVERTED" }
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "quotation.convert",
      entity: "Quotation",
      entityId: quotation.id,
      after: JSON.stringify({ jobId: job.id, jobCode })
    }
  }).catch(() => {});

  // Notify production team
  const recips = await usersByRoles(["PRODUCTION_MANAGER", "DESIGNER", "PRODUCTION_STAFF"]);
  await notify({
    userIds: recips.filter((id) => id !== user.id),
    type: "JOB_CONFIRMED",
    title: `New job: ${job.code}`,
    body: `Converted from quotation ${quotation.code}`,
    link: `/jobs/${job.id}`
  }).catch(() => {});

  return NextResponse.json({ job });
}
