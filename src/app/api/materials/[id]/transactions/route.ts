import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const TxnInput = z.object({
  type: z.enum(["RECEIVE", "ISSUE", "ADJUST", "RETURN"]),
  quantity: z.number(),    // positive; sign applied by type
  unit: z.string().optional(),
  unitCost: z.number().optional().nullable(),
  jobId: z.string().optional().nullable(),
  note: z.string().optional().nullable()
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = TxnInput.parse(body);

  const material = await prisma.material.findUnique({ where: { id: params.id } });
  if (!material) return NextResponse.json({ error: "Material not found" }, { status: 404 });

  // Apply stock delta based on type
  let delta = 0;
  if (parsed.type === "RECEIVE" || parsed.type === "RETURN") delta = parsed.quantity;
  if (parsed.type === "ISSUE") delta = -parsed.quantity;
  if (parsed.type === "ADJUST") delta = parsed.quantity; // can be +/-

  const newQty = Number(material.stockQty) + delta;
  if (newQty < 0) {
    return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
  }

  const [txn] = await prisma.$transaction([
    prisma.inventoryTransaction.create({
      data: {
        materialId: params.id,
        type: parsed.type,
        quantity: Math.abs(parsed.quantity),
        unit: parsed.unit ?? material.unit,
        unitCost: parsed.unitCost ?? null,
        jobId: parsed.jobId || null,
        note: parsed.note || null
      }
    }),
    prisma.material.update({
      where: { id: params.id },
      data: { stockQty: newQty }
    })
  ]);

  return NextResponse.json({ transaction: txn, newStock: newQty });
}
