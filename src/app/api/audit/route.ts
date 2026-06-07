import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const entity = req.nextUrl.searchParams.get("entity");
  const action = req.nextUrl.searchParams.get("action");
  const where: any = {};
  if (entity) where.entity = entity;
  if (action) where.action = { contains: action };

  const logs = await prisma.auditLog.findMany({
    where,
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 500
  });
  return NextResponse.json({
    logs: logs.map((l) => ({
      id: l.id, action: l.action, entity: l.entity, entityId: l.entityId,
      actor: l.user?.fullName ?? "system",
      role: l.user?.role ?? null,
      createdAt: l.createdAt.toISOString(),
      after: l.after, before: l.before
    }))
  });
}
