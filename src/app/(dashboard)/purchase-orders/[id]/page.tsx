import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PODetail } from "./detail.client";

export const dynamic = "force-dynamic";

export default async function PODetailPage({ params }: { params: { id: string } }) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: params.id },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      createdBy: true
    }
  });
  if (!po) notFound();

  return (
    <PODetail
      po={{
        id: po.id,
        code: po.code,
        status: po.status,
        supplier: {
          name: po.supplierName,
          address: po.supplierAddress,
          phone: po.supplierPhone,
          email: po.supplierEmail,
          taxId: po.supplierTaxId
        },
        currency: po.currency,
        language: po.language,
        issueDate: po.issueDate.toISOString(),
        expectedDate: po.expectedDate ? po.expectedDate.toISOString() : null,
        receivedDate: po.receivedDate ? po.receivedDate.toISOString() : null,
        subtotal: Number(po.subtotal),
        taxPercent: Number(po.taxPercent),
        taxAmount: Number(po.taxAmount),
        shipping: Number(po.shipping),
        total: Number(po.total),
        note: po.note,
        termsText: po.termsText,
        createdBy: po.createdBy.fullName,
        items: po.items.map((it) => ({
          id: it.id,
          materialId: it.materialId,
          description: it.description,
          quantity: Number(it.quantity),
          unit: it.unit,
          unitPrice: Number(it.unitPrice),
          lineTotal: Number(it.lineTotal),
          receivedQty: Number(it.receivedQty),
          note: it.note
        }))
      }}
    />
  );
}
