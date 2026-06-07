import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const ScheduleInput = z.object({
  installments: z.array(z.object({
    label: z.string().min(1),
    dueDate: z.string(),                  // ISO
    amount: z.number().positive(),
    note: z.string().nullable().optional()
  })).min(1)
});

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const schedules = await prisma.paymentSchedule.findMany({
    where: { financeDocId: params.id },
    include: { payments: true },
    orderBy: { dueDate: "asc" }
  });
  const today = new Date();
  return NextResponse.json({
    schedules: schedules.map((s) => {
      const paidSum = s.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const due = new Date(s.dueDate);
      let status = s.status;
      if (status === "PENDING") {
        if (paidSum >= Number(s.amount)) status = "PAID";
        else if (paidSum > 0) status = "PARTIAL";
        else if (due < today) status = "OVERDUE";
      }
      return {
        id: s.id, label: s.label, amount: Number(s.amount), currency: s.currency,
        dueDate: s.dueDate.toISOString(), status, note: s.note,
        paidSum, balance: Math.max(0, Number(s.amount) - paidSum)
      };
    })
  });
}

/** Replace all schedules for a finance doc with the provided list. */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = ScheduleInput.parse(await req.json());

  const doc = await prisma.financeDocument.findUnique({ where: { id: params.id } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Replace existing schedules (only unpaid ones — paid stay)
  await prisma.$transaction(async (tx) => {
    // Detach payments from schedules that we're about to delete (so payments are preserved)
    const existing = await tx.paymentSchedule.findMany({
      where: { financeDocId: params.id, status: { in: ["PENDING", "OVERDUE", "CANCELLED"] } }
    });
    if (existing.length > 0) {
      const ids = existing.map((s) => s.id);
      await tx.payment.updateMany({ where: { scheduleId: { in: ids } }, data: { scheduleId: null } });
      await tx.paymentSchedule.deleteMany({ where: { id: { in: ids } } });
    }
    // Create fresh schedules
    for (const inst of parsed.installments) {
      await tx.paymentSchedule.create({
        data: {
          financeDocId: params.id,
          label: inst.label,
          dueDate: new Date(inst.dueDate),
          amount: inst.amount,
          currency: doc.currency,
          note: inst.note ?? null
        }
      });
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id, action: "finance.schedule.set",
      entity: "FinanceDocument", entityId: params.id,
      after: JSON.stringify({ count: parsed.installments.length })
    }
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
