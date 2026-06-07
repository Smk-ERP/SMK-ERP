import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const doc = await prisma.financeDocument.findUnique({
    where: { id: params.id },
    include: {
      createdBy: true,
      payments: { orderBy: { receivedAt: "desc" } }
    }
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let job = null, customer = null;
  if (doc.jobId) job = await prisma.job.findUnique({ where: { id: doc.jobId } });
  if (doc.customerId) customer = await prisma.customer.findUnique({ where: { id: doc.customerId } });

  return NextResponse.json({
    doc: {
      ...doc,
      amount: Number(doc.amount),
      taxAmount: Number(doc.taxAmount),
      total: Number(doc.total),
      payments: doc.payments.map((p) => ({ ...p, amount: Number(p.amount) })),
      job, customer
    }
  });
}
