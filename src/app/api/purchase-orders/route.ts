import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { nextPurchaseOrderCode } from "@/lib/codes";
import { notify, usersByRoles } from "@/lib/notify";
import { z } from "zod";

const ItemInput = z.object({
  materialId: z.string().optional().nullable(),
  description: z.string().min(1),
  quantity: z.number().min(0.001),
  unit: z.string().default("PCS"),
  unitPrice: z.number().min(0).default(0),
  note: z.string().optional().nullable()
});

const Input = z.object({
  supplierName: z.string().min(1),
  supplierAddress: z.string().optional().nullable(),
  supplierPhone: z.string().optional().nullable(),
  supplierEmail: z.string().optional().nullable(),
  supplierTaxId: z.string().optional().nullable(),
  currency: z.string().default("LAK"),
  language: z.string().default("lo"),
  expectedDate: z.string().optional().nullable(),
  taxPercent: z.number().min(0).max(100).default(0),
  shipping: z.number().min(0).default(0),
  note: z.string().optional().nullable(),
  termsText: z.string().optional().nullable(),
  jobId: z.string().optional().nullable(),
  materialRequestId: z.string().optional().nullable(),
  items: z.array(ItemInput).min(1)
});

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const where: any = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { code: { contains: q } },
      { supplierName: { contains: q } }
    ];
  }
  const orders = await prisma.purchaseOrder.findMany({
    where,
    include: { createdBy: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 200
  });
  return NextResponse.json({
    orders: orders.map((o) => ({
      ...o,
      subtotal: Number(o.subtotal),
      taxAmount: Number(o.taxAmount),
      shipping: Number(o.shipping),
      total: Number(o.total),
      itemCount: o.items.length
    }))
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Input.parse(await req.json());

  const code = await nextPurchaseOrderCode();
  const subtotal = parsed.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const taxBase = subtotal + parsed.shipping;
  const tax = taxBase * (parsed.taxPercent / 100);
  const total = taxBase + tax;

  const po = await prisma.purchaseOrder.create({
    data: {
      code,
      supplierName: parsed.supplierName,
      supplierAddress: parsed.supplierAddress || null,
      supplierPhone: parsed.supplierPhone || null,
      supplierEmail: parsed.supplierEmail || null,
      supplierTaxId: parsed.supplierTaxId || null,
      currency: parsed.currency,
      language: parsed.language,
      expectedDate: parsed.expectedDate ? new Date(parsed.expectedDate) : null,
      subtotal,
      taxPercent: parsed.taxPercent,
      taxAmount: tax,
      shipping: parsed.shipping,
      total,
      note: parsed.note || null,
      termsText: parsed.termsText || null,
      jobId: parsed.jobId || null,
      materialRequestId: parsed.materialRequestId || null,
      createdById: user.id,
      items: {
        create: parsed.items.map((it, i) => ({
          sortOrder: i,
          materialId: it.materialId || null,
          description: it.description,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice,
          lineTotal: it.quantity * it.unitPrice,
          note: it.note || null
        }))
      }
    },
    include: { items: true }
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id, action: "purchaseOrder.create",
      entity: "PurchaseOrder", entityId: po.id,
      after: JSON.stringify({ code: po.code, total })
    }
  }).catch(() => {});

  return NextResponse.json({ order: po });
}
