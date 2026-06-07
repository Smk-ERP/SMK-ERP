import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import { USER_ROLES } from "@/lib/enums";

const UserInput = z.object({
  fullName:       z.string().min(1),
  email:          z.string().email(),
  phone:          z.string().optional().nullable(),
  role:           z.enum(USER_ROLES),
  language:       z.string().default("lo"),
  active:         z.boolean().default(true),
  telegramChatId: z.string().optional().nullable()
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    orderBy: [{ active: "desc" }, { fullName: "asc" }],
    select: {
      id: true, fullName: true, email: true,
      phone: true, role: true, active: true,
      language: true, createdAt: true, telegramChatId: true
    }
  });
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["OWNER", "ADMIN_MANAGER"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = UserInput.parse(body);

    // Check email unique
    const exists = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (exists) return NextResponse.json({ error: "Email already exists" }, { status: 400 });

    const created = await prisma.user.create({
      data: {
        fullName:       parsed.fullName,
        email:          parsed.email,
        phone:          parsed.phone ?? null,
        role:           parsed.role,
        language:       parsed.language,
        active:         parsed.active,
        telegramChatId: parsed.telegramChatId ?? null
      }
    });
    return NextResponse.json({ user: created }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Invalid input" }, { status: 400 });
  }
}
