import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notify, usersByRoles } from "@/lib/notify";
import { z } from "zod";

const Input = z.object({
  amount: z.number().positive(),
  currency: z.string().default("LAK"),
  method: z.string().default("CASH"),
  reference: z.string().optional().nullable(),
  receivedAt: z.string().optional().nullable(),
  scheduleId: z.string().optional().nullable()
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Input.parse(await req.json());

  const doc = await prisma.financeDocument.findUnique({
    where: { id: params.id },
    include: { payments: true }
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const payment = await prisma.payment.create({
    data: {
      financeDocId: doc.id,
      scheduleId: parsed.scheduleId || null,
      amount: parsed.amount,
      currency: parsed.currency,
      method: parsed.method,
      reference: parsed.reference || null,
      receivedAt: parsed.receivedAt ? new Date(parsed.receivedAt) : new Date()
    }
  });

  // If linked to schedule — update schedule status based on cumulative payments
  if (parsed.scheduleId) {
    const sch = await prisma.paymentSchedule.findUnique({
      where: { id: parsed.scheduleId },
      include: { payments: true }
    });
    if (sch) {
      const total = sch.payments.reduce((s, p) => s + Number(p.amount), 0);
      const status = total >= Number(sch.amount) ? "PAID" : total > 0 ? "PARTIAL" : sch.status;
      await prisma.paymentSchedule.update({ where: { id: sch.id }, data: { status } });
    }
  }

  // Auto-mark paid if cumulative >= total
  const sumPaid = doc.payments.reduce((s, p) => s + Number(p.amount), 0) + parsed.amount;
  if (sumPaid >= Number(doc.total) && !doc.paidAt) {
    await prisma.financeDocument.update({
      where: { id: doc.id },
      data: { paidAt: new Date() }
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: user.id, action: "finance.payment",
      entity: "FinanceDocument", entityId: doc.id,
      after: JSON.stringify({ paymentId: payment.id, amount: parsed.amount })
    }
  }).catch(() => {});

  // Notify finance + sales manager
  const recipients = await usersByRoles(["FINANCE", "SALES_MANAGER", "OWNER", "ADMIN_MANAGER"]);
  await notify({
    userIds: recipients.filter((id) => id !== user.id),
    type: "PAYMENT_RECEIVED",
    title: `Payment received: ${doc.code}`,
    body: `${parsed.amount} ${parsed.currency} via ${parsed.method}`,
    link: `/finance/${doc.id}`
  }).catch(() => {});

  return NextResponse.json({ payment });
}
