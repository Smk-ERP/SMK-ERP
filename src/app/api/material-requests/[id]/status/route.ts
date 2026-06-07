import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notify, usersByRoles } from "@/lib/notify";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = (await req.json()) as { status: "APPROVED" | "ISSUED" | "REJECTED" };
  const mr = await prisma.materialRequest.findUnique({
    where: { id: params.id }, include: { items: { include: { material: true } } }
  });
  if (!mr) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // When issuing: deduct from stock + create inventory transactions, tied to the job
  if (status === "ISSUED") {
    if (mr.status !== "APPROVED") {
      return NextResponse.json({ error: "Must be APPROVED before issuing" }, { status: 400 });
    }
    // Verify stock
    for (const it of mr.items) {
      if (Number(it.material.stockQty) < Number(it.quantity)) {
        return NextResponse.json({
          error: `Insufficient stock for ${it.material.name}: need ${it.quantity}, have ${it.material.stockQty}`
        }, { status: 400 });
      }
    }
    // Apply deductions atomically
    await prisma.$transaction([
      ...mr.items.flatMap((it) => [
        prisma.material.update({
          where: { id: it.materialId },
          data: { stockQty: { decrement: it.quantity } }
        }),
        prisma.inventoryTransaction.create({
          data: {
            materialId: it.materialId,
            type: "ISSUE",
            quantity: it.quantity,
            unit: it.unit,
            unitCost: it.material.unitCost,
            jobId: mr.jobId,
            note: `MR ${mr.code}`
          }
        })
      ]),
      prisma.materialRequest.update({
        where: { id: mr.id },
        data: { status: "ISSUED" }
      })
    ]);
  } else {
    await prisma.materialRequest.update({ where: { id: mr.id }, data: { status } });
  }

  await prisma.auditLog.create({
    data: {
      userId: user.id, action: `materialRequest.${status.toLowerCase()}`,
      entity: "MaterialRequest", entityId: mr.id,
      after: JSON.stringify({ status })
    }
  }).catch(() => {});

  // Notifications
  if (status === "APPROVED") {
    const ids = new Set<string>([mr.requestedById]);
    (await usersByRoles(["STOCK", "PRODUCTION_MANAGER"])).forEach((id) => ids.add(id));
    ids.delete(user.id);
    await notify({
      userIds: Array.from(ids), type: "MATERIAL_APPROVED",
      title: `MR ${mr.code} approved`,
      body: `Ready to issue ${mr.items.length} items`,
      link: `/material-requests/${mr.id}`
    }).catch(() => {});
  }
  if (status === "REJECTED") {
    await notify({
      userIds: [mr.requestedById], type: "GENERIC",
      title: `MR ${mr.code} rejected`, link: `/material-requests/${mr.id}`
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
