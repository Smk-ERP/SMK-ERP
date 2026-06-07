import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { QuotationDetail } from "./detail.client";

export const dynamic = "force-dynamic";

export default async function QuotationDetailPage({ params }: { params: { id: string } }) {
  const q = await prisma.quotation.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: "asc" } },
      createdBy: true,
      job: true
    }
  });
  if (!q) notFound();

  const dto = {
    id: q.id,
    code: q.code,
    status: q.status,
    currency: q.currency,
    language: q.language,
    issueDate: q.issueDate.toISOString(),
    validUntil: q.validUntil ? q.validUntil.toISOString() : null,
    subtotal: Number(q.subtotal),
    discountAmount: Number(q.discountAmount),
    discountPercent: Number(q.discountPercent),
    taxPercent: Number(q.taxPercent),
    taxAmount: Number(q.taxAmount),
    total: Number(q.total),
    marginActual: Number(q.marginActual),
    note: q.note,
    termsText: q.termsText,
    customer: {
      id: q.customer.id,
      name: q.customer.name,
      code: q.customer.code,
      companyName: q.customer.companyName,
      phone: q.customer.phone,
      address: q.customer.address
    },
    items: q.items.map((it) => ({
      id: it.id,
      title: it.title,
      description: it.description,
      signType: it.signType,
      widthMm: it.widthMm ? Number(it.widthMm) : null,
      heightMm: it.heightMm ? Number(it.heightMm) : null,
      quantity: Number(it.quantity),
      unit: it.unit,
      unitPrice: Number(it.unitPrice),
      lineTotal: Number(it.lineTotal)
    })),
    createdBy: q.createdBy.fullName,
    jobId: q.job?.id ?? null,
    jobCode: q.job?.code ?? null
  };

  return <QuotationDetail q={dto} />;
}
