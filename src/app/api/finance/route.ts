import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { nextFinanceDocCode } from "@/lib/codes";
import { notify, usersByRoles } from "@/lib/notify";
import { z } from "zod";

const Input = z.object({
  docType: z.enum([
    "BILLING_NOTE", "INVOICE", "RECEIPT", "PAYMENT_SLIP",
    "DELIVERY_NOTE", "INSTALLATION_REPORT"
  ]),
  jobId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  quotationId: z.string().optional().nullable(), // copy items from this
  currency: z.string().default("LAK"),
  language: z.string().default("lo"),
  amount: z.number().min(0).optional(),
  taxPercent: z.number().min(0).max(100).default(0),
  note: z.string().optional().nullable()
});

export async function GET(req: NextRequest) {
  const docType = req.nextUrl.searchParams.get("type");
  const paid = req.nextUrl.searchParams.get("paid");
  const where: any = {};
  if (docType) where.docType = docType;
  if (paid === "true")  where.paidAt = { not: null };
  if (paid === "false") where.paidAt = null;

  const docs = await prisma.financeDocument.findMany({
    where,
    include: { createdBy: true, payments: true },
    orderBy: { issuedAt: "desc" },
    take: 200
  });
  return NextResponse.json({
    docs: docs.map((d) => ({
      ...d,
      amount: Number(d.amount),
      taxAmount: Number(d.taxAmount),
      total: Number(d.total),
      paymentsSum: d.payments.reduce((s, p) => s + Number(p.amount), 0)
    }))
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Input.parse(await req.json());

  // Source items: if quotationId given, copy line items into payload
  let payload: any = { items: [] };
  let amount = parsed.amount ?? 0;
  let customerId = parsed.customerId ?? null;

  if (parsed.quotationId) {
    const q = await prisma.quotation.findUnique({
      where: { id: parsed.quotationId },
      include: { items: true, customer: true }
    });
    if (q) {
      payload.items = q.items.map((it) => ({
        title: it.title,
        description: it.description,
        quantity: Number(it.quantity),
        unit: it.unit,
        unitPrice: Number(it.unitPrice),
        lineTotal: Number(it.lineTotal)
      }));
      payload.quotationCode = q.code;
      payload.customer = {
        name: q.customer.name, companyName: q.customer.companyName,
        phone: q.customer.phone, address: q.customer.address, taxId: q.customer.taxId
      };
      amount = parsed.amount ?? Number(q.total);
      customerId = customerId ?? q.customerId;
    }
  }

  const tax = amount * (parsed.taxPercent / 100);
  const total = amount + tax;

  const code = await nextFinanceDocCode(parsed.docType);
  const doc = await prisma.financeDocument.create({
    data: {
      code,
      docType: parsed.docType,
      jobId: parsed.jobId || null,
      customerId: customerId || null,
      currency: parsed.currency,
      language: parsed.language,
      amount,
      taxAmount: tax,
      total,
      payload: JSON.stringify({ ...payload, note: parsed.note ?? null, taxPercent: parsed.taxPercent }),
      createdById: user.id
    }
  });

  // Audit
  await prisma.auditLog.create({
    data: {
      userId: user.id, action: `finance.create.${parsed.docType.toLowerCase()}`,
      entity: "FinanceDocument", entityId: doc.id,
      after: JSON.stringify({ code, docType: parsed.docType, total })
    }
  }).catch(() => {});

  return NextResponse.json({ doc });
}
