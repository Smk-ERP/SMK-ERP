import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const Input = z.object({
  status: z.enum(["DRAFT", "SENT", "PARTIAL", "RECEIVED", "CANCELLED"]),
  receiveItems: z.array(z.object({
    itemId: z.string(),
    receivedQty: z.number().min(0)
  })).optional()
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Input.parse(await req.json());

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: params.id },
    include: { items: true }
  });
  if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // When marking RECEIVED or PARTIAL — also receive into inventory for items linked to materials
  if ((parsed.status === "RECEIVED" || parsed.status === "PARTIAL") && parsed.receiveItems) {
    await prisma.$transaction(async (tx) => {
      for (const r of parsed.receiveItems!) {
        const item = po.items.find((i) => i.id === r.itemId);
        if (!item) continue;
        const previouslyReceived = Number(item.receivedQty);
        const delta = r.receivedQty - previouslyReceived;
        if (delta <= 0) continue;

        await tx.purchaseOrderItem.update({
          where: { id: r.itemId },
          data: { receivedQty: r.receivedQty }
        });

        // If linked to a Material, increment its stock + record InventoryTransaction
        if (item.materialId) {
          await tx.material.update({
            where: { id: item.materialId },
            data: { stockQty: { increment: delta } }
          });
          await tx.inventoryTransaction.create({
            data: {
              materialId: item.materialId,
              type: "RECEIVE",
              quantity: delta,
              unit: item.unit,
              unitCost: item.unitPrice,
              note: `PO ${po.code}`
            }
          });
        }
      }
    });
  }

  // Update status
  const data: any = { status: parsed.status };
  if (parsed.status === "RECEIVED") data.receivedDate = new Date();
  await prisma.purchaseOrder.update({ where: { id: params.id }, data });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: `purchaseOrder.${parsed.status.toLowerCase()}`,
      entity: "PurchaseOrder",
      entityId: params.id,
      after: JSON.stringify({ status: parsed.status })
    }
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
