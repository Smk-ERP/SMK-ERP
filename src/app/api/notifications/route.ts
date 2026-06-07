import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ notifications: [], unread: 0 });

  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "20");
  const onlyUnread = req.nextUrl.searchParams.get("unread") === "1";

  const where: any = { userId: user.id };
  if (onlyUnread) where.read = false;

  const [notifs, unread] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100)
    }),
    prisma.notification.count({ where: { userId: user.id, read: false } })
  ]);

  return NextResponse.json({
    notifications: notifs.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })),
    unread
  });
}

export async function POST(req: NextRequest) {
  // Mark notifications as read
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids, all } = (await req.json()) as { ids?: string[]; all?: boolean };
  if (all) {
    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true }
    });
  } else if (ids && ids.length > 0) {
    await prisma.notification.updateMany({
      where: { userId: user.id, id: { in: ids } },
      data: { read: true }
    });
  }
  return NextResponse.json({ ok: true });
}
