import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canApproveQuotation } from "@/lib/rbac";
import { notify, usersByRoles } from "@/lib/notify";
import type { QuotationStatus } from "@/lib/enums";

const ALLOWED: QuotationStatus[] = ["DRAFT", "SENT", "APPROVED", "REJECTED", "EXPIRED"];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status, reason } = (await req.json()) as { status: QuotationStatus; reason?: string };
  if (!ALLOWED.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  if ((status === "APPROVED" || status === "REJECTED") && !canApproveQuotation(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.quotation.update({
    where: { id: params.id },
    data: {
      status,
      approvedAt: status === "APPROVED" ? new Date() : undefined,
      rejectedReason: status === "REJECTED" ? reason ?? null : null
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: `quotation.${status.toLowerCase()}`,
      entity: "Quotation",
      entityId: params.id,
      after: JSON.stringify({ status, reason: reason ?? null })
    }
  }).catch(() => {});

  // Notify creator + sales managers when approved/rejected
  if (status === "APPROVED" || status === "REJECTED") {
    const ids = new Set<string>();
    if (updated.createdById) ids.add(updated.createdById);
    (await usersByRoles(["SALES_MANAGER", "OWNER", "ADMIN_MANAGER"])).forEach((id) => ids.add(id));
    ids.delete(user.id);
    await notify({
      userIds: Array.from(ids),
      type: status === "APPROVED" ? "QUOTATION_APPROVED" : "GENERIC",
      title: `Quotation ${updated.code} ${status.toLowerCase()}`,
      body: reason ?? undefined,
      link: `/quotations/${params.id}`
    }).catch(() => {});
  }

  return NextResponse.json({ quotation: updated });
}
