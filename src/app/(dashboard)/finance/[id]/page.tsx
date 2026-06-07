import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FinanceDetail } from "./detail.client";

export const dynamic = "force-dynamic";

export default async function FinanceDocPage({ params }: { params: { id: string } }) {
  const doc = await prisma.financeDocument.findUnique({
    where: { id: params.id },
    include: { createdBy: true, payments: { orderBy: { receivedAt: "desc" } } }
  });
  if (!doc) notFound();

  const customer = doc.customerId ? await prisma.customer.findUnique({ where: { id: doc.customerId } }) : null;
  const job = doc.jobId ? await prisma.job.findUnique({ where: { id: doc.jobId } }) : null;

  let payload: any = {};
  try { payload = JSON.parse(doc.payload as string); } catch {}

  const paidSum = doc.payments.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <FinanceDetail
      doc={{
        id: doc.id,
        code: doc.code,
        docType: doc.docType,
        currency: doc.currency,
        language: doc.language,
        issuedAt: doc.issuedAt.toISOString(),
        paidAt: doc.paidAt ? doc.paidAt.toISOString() : null,
        amount: Number(doc.amount),
        taxAmount: Number(doc.taxAmount),
        taxPercent: payload.taxPercent ?? 0,
        total: Number(doc.total),
        paidSum,
        balance: Math.max(0, Number(doc.total) - paidSum),
        note: payload.note ?? null,
        quotationCode: payload.quotationCode ?? null,
        items: payload.items ?? [],
        createdBy: doc.createdBy.fullName,
        customer: customer ? {
          id: customer.id, name: customer.name, code: customer.code,
          companyName: customer.companyName, phone: customer.phone, address: customer.address
        } : null,
        job: job ? { id: job.id, code: job.code } : null,
        payments: doc.payments.map((p) => ({
          id: p.id, amount: Number(p.amount), currency: p.currency,
          method: p.method, reference: p.reference,
          receivedAt: p.receivedAt.toISOString()
        }))
      }}
    />
  );
}
