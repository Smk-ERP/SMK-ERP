import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import { USER_ROLES } from "@/lib/enums";

const UserUpdate = z.object({
  fullName:       z.string().min(1).optional(),
  email:          z.string().email().optional(),
  phone:          z.string().optional().nullable(),
  role:           z.enum(USER_ROLES).optional(),
  language:       z.string().optional(),
  active:         z.boolean().optional(),
  telegramChatId: z.string().optional().nullable()
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const u = await prisma.user.findUnique({ where: { id: params.id } });
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ user: u });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["OWNER", "ADMIN_MANAGER"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = UserUpdate.parse(body);

    // If email changed, check unique
    if (parsed.email) {
      const exists = await prisma.user.findFirst({
        where: { email: parsed.email, NOT: { id: params.id } }
      });
      if (exists) return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data:  parsed
    });
    return NextResponse.json({ user: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Invalid input" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["OWNER", "ADMIN_MANAGER"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (user.id === params.id)
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });

  try {
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    // User may have relations — deactivate instead
    await prisma.user.update({ where: { id: params.id }, data: { active: false } });
    return NextResponse.json({ ok: true, deactivated: true });
  }
}
