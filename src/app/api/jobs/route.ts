import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const where: any = {};
  if (status) where.status = status;
  const jobs = await prisma.job.findMany({
    where,
    include: { customer: true, quotation: true, assignedTo: true },
    orderBy: { createdAt: "desc" },
    take: 200
  });
  return NextResponse.json({ jobs });
}
