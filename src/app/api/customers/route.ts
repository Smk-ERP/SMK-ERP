import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nextCustomerCode } from "@/lib/codes";
import { z } from "zod";
import type { CustomerType } from "@/lib/enums";

const CustomerInput = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
  companyName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  whatsapp: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  tiktok: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  note: z.string().optional().nullable()
});

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const type = req.nextUrl.searchParams.get("type");
  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { code: { contains: q } },
      { phone: { contains: q } },
      { companyName: { contains: q } }
    ];
  }
  if (type) where.type = type;
  const customers = await prisma.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200
  });
  return NextResponse.json({ customers });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CustomerInput.parse(body);
  const code = await nextCustomerCode();
  const customer = await prisma.customer.create({
    data: {
      code,
      name: parsed.name,
      type: (parsed.type as CustomerType) || "WALK_IN",
      companyName: parsed.companyName || null,
      phone: parsed.phone || null,
      email: parsed.email || null,
      whatsapp: parsed.whatsapp || null,
      facebook: parsed.facebook || null,
      tiktok: parsed.tiktok || null,
      address: parsed.address || null,
      city: parsed.city || null,
      province: parsed.province || null,
      taxId: parsed.taxId || null,
      note: parsed.note || null,
      country: "LA"
    }
  });
  return NextResponse.json({ customer });
}
