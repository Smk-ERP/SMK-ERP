import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const q = await prisma.quotation.findUnique({
    where: { id: params.id },
    include: { customer: true, items: { orderBy: { sortOrder: "asc" } }, createdBy: true, job: true }
  });
  if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ quotation: q });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.quotation.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
