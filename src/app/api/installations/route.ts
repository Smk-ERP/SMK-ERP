import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const Input = z.object({
  jobId: z.string(),
  scheduledAt: z.string().optional().nullable(),
  ownerId: z.string().optional(),
  note: z.string().optional().nullable()
});

export async function GET(_: NextRequest) {
  const rows = await prisma.installation.findMany({
    include: { job: { include: { customer: true } }, owner: true },
    orderBy: { scheduledAt: "desc" },
    take: 200
  });
  return NextResponse.json({ installations: rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Input.parse(await req.json());
  const inst = await prisma.installation.create({
    data: {
      jobId: parsed.jobId,
      ownerId: parsed.ownerId ?? user.id,
      status: "SCHEDULED",
      scheduledAt: parsed.scheduledAt ? new Date(parsed.scheduledAt) : null,
      note: parsed.note || null
    }
  });
  return NextResponse.json({ installation: inst });
}
