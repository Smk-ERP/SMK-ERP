import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: params.id },
    include: { createdBy: true, items: { orderBy: { sortOrder: "asc" } } }
  });
  if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    order: {
      ...po,
      subtotal: Number(po.subtotal),
      taxAmount: Number(po.taxAmount),
      shipping: Number(po.shipping),
      total: Number(po.total),
      taxPercent: Number(po.taxPercent),
      items: po.items.map((it) => ({
        ...it,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
        lineTotal: Number(it.lineTotal),
        receivedQty: Number(it.receivedQty)
      }))
    }
  });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.purchaseOrder.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
