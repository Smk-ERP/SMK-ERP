import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MaterialInput = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1),
  category: z.string().optional().nullable(),
  unit: z.string(),
  unitCost: z.number().min(0).default(0),
  currency: z.string().default("THB"),
  stockQty: z.number().min(0).default(0),
  reorderLevel: z.number().min(0).default(0)
});

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const low = req.nextUrl.searchParams.get("low") === "1";

  let materials = await prisma.material.findMany({
    where: q ? {
      OR: [
        { code: { contains: q } },
        { name: { contains: q } },
        { category: { contains: q } }
      ]
    } : undefined,
    orderBy: { name: "asc" },
    take: 500
  });

  if (low) {
    materials = materials.filter((m) => Number(m.stockQty) <= Number(m.reorderLevel));
  }

  return NextResponse.json({
    materials: materials.map((m) => ({
      ...m,
      unitCost: Number(m.unitCost),
      stockQty: Number(m.stockQty),
      reorderLevel: Number(m.reorderLevel),
      isLow: Number(m.stockQty) <= Number(m.reorderLevel)
    }))
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = MaterialInput.parse(body);
  const code = parsed.code ?? `MAT-${Date.now().toString(36).toUpperCase()}`;
  const material = await prisma.material.create({
    data: {
      code,
      name: parsed.name,
      category: parsed.category || null,
      unit: parsed.unit,
      unitCost: parsed.unitCost,
      currency: parsed.currency,
      stockQty: parsed.stockQty,
      reorderLevel: parsed.reorderLevel
    }
  });
  return NextResponse.json({ material });
}
