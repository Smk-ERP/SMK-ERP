import { prisma } from "@/lib/prisma";
import { AuditLogView } from "./view.client";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const logs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 300
  });
  return (
    <AuditLogView
      initial={logs.map((l) => ({
        id: l.id, action: l.action, entity: l.entity, entityId: l.entityId,
        actor: l.user?.fullName ?? "system",
        role: l.user?.role ?? null,
        createdAt: l.createdAt.toISOString(),
        after: l.after as any, before: l.before as any
      }))}
    />
  );
}
