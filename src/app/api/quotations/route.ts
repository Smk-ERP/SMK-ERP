import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nextQuotationCode } from "@/lib/codes";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import type { Currency, SignType, UnitType } from "@/lib/enums";

const ItemInput = z.object({
  signType: z.string(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  widthMm: z.number().nullable().optional(),
  heightMm: z.number().nullable().optional(),
  areaSqm: z.number().nullable().optional(),
  quantity: z.number().min(0.01),
  unit: z.string().default("PCS"),
  unitCost: z.number().min(0).default(0),
  unitPrice: z.number().min(0),
  markupPercent: z.number().min(0).default(30),
  costBreakdown: z.any().optional()
});

const QuotationInput = z.object({
  customerId: z.string(),
  currency: z.string().default("LAK"),
  language: z.string().default("lo"),
  validUntil: z.string().optional().nullable(),
  discountPercent: z.number().min(0).max(100).default(0),
  discountAmount: z.number().min(0).default(0),
  taxPercent: z.number().min(0).max(100).default(0),
  note: z.string().optional().nullable(),
  termsText: z.string().optional().nullable(),
  items: z.array(ItemInput).min(1)
});

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const status = req.nextUrl.searchParams.get("status");
  const where: any = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { code: { contains: q } },
      { customer: { name: { contains: q } } }
    ];
  }
  const quotations = await prisma.quotation.findMany({
    where,
    include: { customer: true, items: true, createdBy: true },
    orderBy: { createdAt: "desc" },
    take: 200
  });
  return NextResponse.json({ quotations });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = QuotationInput.parse(body);

  const code = await nextQuotationCode();

  const subtotal = parsed.items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
  const discount = parsed.discountAmount + subtotal * (parsed.discountPercent / 100);
  const taxable = Math.max(0, subtotal - discount);
  const tax = taxable * (parsed.taxPercent / 100);
  const total = taxable + tax;

  const costTotal = parsed.items.reduce((s, it) => s + it.unitCost * it.quantity, 0);
  const marginActual = total > 0 ? ((total - costTotal) / total) * 100 : 0;

  const quotation = await prisma.quotation.create({
    data: {
      code,
      customerId: parsed.customerId,
      createdById: user.id,
      currency: parsed.currency as Currency,
      language: parsed.language,
      validUntil: parsed.validUntil ? new Date(parsed.validUntil) : null,
      subtotal,
      discountAmount: parsed.discountAmount,
      discountPercent: parsed.discountPercent,
      taxPercent: parsed.taxPercent,
      taxAmount: tax,
      total,
      marginActual,
      note: parsed.note || null,
      termsText: parsed.termsText || null,
      items: {
        create: parsed.items.map((it, i) => ({
          sortOrder: i,
          signType: it.signType as SignType,
          title: it.title,
          description: it.description || null,
          widthMm: it.widthMm ?? null,
          heightMm: it.heightMm ?? null,
          areaSqm: it.areaSqm ?? null,
          quantity: it.quantity,
          unit: it.unit as UnitType,
          unitCost: it.unitCost,
          unitPrice: it.unitPrice,
          lineTotal: it.unitPrice * it.quantity,
          markupPercent: it.markupPercent,
          costBreakdown: it.costBreakdown ? JSON.stringify(it.costBreakdown) : null
        }))
      }
    },
    include: { items: true, customer: true }
  });

  return NextResponse.json({ quotation });
}
