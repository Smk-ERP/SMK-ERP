import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { NotificationsList } from "./list.client";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const items = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 200
  });
  return (
    <NotificationsList
      initial={items.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }))}
    />
  );
}
