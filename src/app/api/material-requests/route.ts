import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { nextMaterialRequestCode } from "@/lib/codes";
import { z } from "zod";

const Input = z.object({
  jobId: z.string(),
  note: z.string().optional().nullable(),
  items: z.array(z.object({
    materialId: z.string(),
    quantity: z.number().min(0.001),
    unit: z.string()
  })).min(1)
});

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const where: any = {};
  if (status) where.status = status;
  const rows = await prisma.materialRequest.findMany({
    where,
    include: { job: { include: { customer: true } }, requestedBy: true, items: { include: { material: true } } },
    orderBy: { createdAt: "desc" },
    take: 200
  });
  return NextResponse.json({ requests: rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Input.parse(await req.json());
  const code = await nextMaterialRequestCode();

  const mr = await prisma.materialRequest.create({
    data: {
      code,
      jobId: parsed.jobId,
      requestedById: user.id,
      status: "REQUESTED",
      note: parsed.note || null,
      items: {
        create: parsed.items.map((it) => ({
          materialId: it.materialId,
          quantity: it.quantity,
          unit: it.unit
        }))
      }
    },
    include: { items: true }
  });
  return NextResponse.json({ request: mr });
}
