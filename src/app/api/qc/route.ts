import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notify, usersByRoles } from "@/lib/notify";
import { z } from "zod";

const QCItemSchema = z.object({
  key: z.string(),
  label: z.string(),
  pass: z.boolean(),
  note: z.string().optional()
});

const Input = z.object({
  jobId: z.string(),
  items: z.array(QCItemSchema).min(1),
  result: z.enum(["PASS", "FAIL"]),
  note: z.string().optional().nullable()
});

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");
  const rows = await prisma.qCChecklist.findMany({
    where: jobId ? { jobId } : undefined,
    include: { job: { include: { customer: true } }, result: { include: { inspectedBy: true, rework: true } } },
    orderBy: { createdAt: "desc" },
    take: 200
  });
  return NextResponse.json({ checks: rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Input.parse(await req.json());

  const created = await prisma.$transaction(async (tx) => {
    const checklist = await tx.qCChecklist.create({
      data: {
        jobId: parsed.jobId,
        items: JSON.stringify(parsed.items)
      }
    });
    const result = await tx.qCResult.create({
      data: {
        checklistId: checklist.id,
        status: parsed.result,
        inspectedById: user.id,
        note: parsed.note || null
      }
    });
    // Auto-create rework task on FAIL
    let rework = null;
    if (parsed.result === "FAIL") {
      const failedItems = parsed.items.filter((it) => !it.pass);
      const desc = failedItems.length > 0
        ? failedItems.map((it) => `${it.label}${it.note ? `: ${it.note}` : ""}`).join("; ")
        : "QC failed";
      rework = await tx.reworkTask.create({
        data: { qcResultId: result.id, description: desc }
      });
      // Move job back to REWORK status
      const job = await tx.job.findUnique({ where: { id: parsed.jobId } });
      if (job) {
        await tx.job.update({
          where: { id: parsed.jobId },
          data: { status: "REWORK" }
        });
        await tx.jobStatusHistory.create({
          data: {
            jobId: parsed.jobId,
            fromStatus: job.status,
            toStatus: "REWORK",
            changedById: user.id,
            note: `QC FAIL — ${desc}`
          }
        });
      }
    } else {
      // PASS — advance to READY_TO_INSTALL
      const job = await tx.job.findUnique({ where: { id: parsed.jobId } });
      if (job && job.status === "QC") {
        await tx.job.update({
          where: { id: parsed.jobId },
          data: { status: "READY_TO_INSTALL" }
        });
        await tx.jobStatusHistory.create({
          data: {
            jobId: parsed.jobId,
            fromStatus: "QC",
            toStatus: "READY_TO_INSTALL",
            changedById: user.id,
            note: "QC PASS"
          }
        });
      }
    }
    return { checklist, result, rework };
  });

  // Notifications
  const recips = await usersByRoles(["PRODUCTION_MANAGER", "OWNER", "ADMIN_MANAGER"]);
  if (parsed.result === "FAIL") {
    await notify({
      userIds: recips.filter((id) => id !== user.id),
      type: "QC_FAILED",
      title: `QC FAIL on job ${parsed.jobId}`,
      body: created.rework?.description ?? "Rework required",
      link: `/jobs/${parsed.jobId}`
    }).catch(() => {});
  } else {
    const installers = await usersByRoles(["INSTALLER"]);
    await notify({
      userIds: [...recips, ...installers].filter((id) => id !== user.id),
      type: "JOB_READY_TO_INSTALL",
      title: `Job ready to install`,
      link: `/jobs/${parsed.jobId}`
    }).catch(() => {});
  }

  return NextResponse.json(created);
}
