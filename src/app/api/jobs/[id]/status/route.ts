import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { JobStatus } from "@/lib/enums";

const ALLOWED: JobStatus[] = [
  "NEW", "CONFIRMED", "DESIGN", "WAITING_MATERIAL", "PRODUCTION",
  "QC", "REWORK", "READY_TO_INSTALL", "INSTALLING", "DELIVERED",
  "COMPLETED", "CANCELLED"
];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status, note } = (await req.json()) as { status: JobStatus; note?: string };
  if (!ALLOWED.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const current = await prisma.job.findUnique({ where: { id: params.id } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const job = await prisma.job.update({
    where: { id: params.id },
    data: {
      status,
      statusHistory: {
        create: {
          fromStatus: current.status,
          toStatus: status,
          changedById: user.id,
          note: note ?? null
        }
      }
    }
  });

  return NextResponse.json({ job });
}
