import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const m = await prisma.material.findUnique({
    where: { id: params.id },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { job: true }
      }
    }
  });
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    material: {
      ...m,
      unitCost: Number(m.unitCost),
      stockQty: Number(m.stockQty),
      reorderLevel: Number(m.reorderLevel),
      transactions: m.transactions.map((t) => ({
        ...t,
        quantity: Number(t.quantity),
        unitCost: t.unitCost ? Number(t.unitCost) : null
      }))
    }
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json();
  const material = await prisma.material.update({ where: { id: params.id }, data });
  return NextResponse.json({ material });
}
