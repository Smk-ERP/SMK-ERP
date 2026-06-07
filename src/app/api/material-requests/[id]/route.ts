import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const mr = await prisma.materialRequest.findUnique({
    where: { id: params.id },
    include: {
      job: { include: { customer: true } },
      requestedBy: true,
      items: { include: { material: true } }
    }
  });
  if (!mr) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ request: mr });
}
