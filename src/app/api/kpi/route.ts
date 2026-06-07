import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { computeCommission } from "@/lib/incentive";
import { z } from "zod";

const Input = z.object({
  userId: z.string(),
  period: z.string(),         // e.g. "2026-05"
  kpiScore: z.number().min(0).max(100),
  kbiScore: z.number().min(0).max(100),
  salesAmount: z.number().min(0).optional().nullable(),
  note: z.string().optional().nullable()
});

export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get("period");
  const userId = req.nextUrl.searchParams.get("userId");
  const where: any = {};
  if (period) where.period = period;
  if (userId) where.userId = userId;

  const rows = await prisma.kPIRecord.findMany({
    where,
    include: { user: true },
    orderBy: [{ period: "desc" }, { totalScore: "desc" }],
    take: 500
  });

  return NextResponse.json({
    records: rows.map((r) => ({
      ...r,
      kpiScore: Number(r.kpiScore),
      kbiScore: Number(r.kbiScore),
      totalScore: Number(r.totalScore),
      salesAmount: r.salesAmount ? Number(r.salesAmount) : 0,
      commission: r.commission ? Number(r.commission) : 0
    }))
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Input.parse(await req.json());

  const result = computeCommission({
    salesLak: parsed.salesAmount ?? 0,
    kpiScore: parsed.kpiScore,
    kbiScore: parsed.kbiScore
  });

  // Upsert: one record per (userId, period)
  const existing = await prisma.kPIRecord.findFirst({
    where: { userId: parsed.userId, period: parsed.period }
  });

  const data = {
    userId: parsed.userId,
    period: parsed.period,
    kpiScore: parsed.kpiScore,
    kbiScore: parsed.kbiScore,
    totalScore: result.totalScore,
    salesAmount: parsed.salesAmount ?? null,
    commission: result.finalCommission,
    note: parsed.note || null
  };

  const record = existing
    ? await prisma.kPIRecord.update({ where: { id: existing.id }, data })
    : await prisma.kPIRecord.create({ data });

  return NextResponse.json({ record, result });
}
