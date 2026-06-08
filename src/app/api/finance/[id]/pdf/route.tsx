import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { FinanceDocumentPDF, type FinancePDFData } from "@/lib/pdf/finance-pdf";
import { getBrand } from "@/lib/brand";
import { generateQRDataUrl } from "@/lib/pdf/qr";
import type { Locale } from "@/lib/i18n/config";
import type { CurrencyCode } from "@/lib/currency";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const lang = (req.nextUrl.searchParams.get("lang") as Locale) || "lo";
    const doc = await prisma.financeDocument.findUnique({
      where: { id: params.id },
      include: { payments: { orderBy: { receivedAt: "asc" } } }
    });
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const customer = doc.customerId ? await prisma.customer.findUnique({ where: { id: doc.customerId } }) : null;
    const job = doc.jobId ? await prisma.job.findUnique({ where: { id: doc.jobId } }) : null;

    let payload: any = {};
    try { payload = JSON.parse(doc.payload as string); } catch {}

    const paymentsSum = doc.payments.reduce((s, p) => s + Number(p.amount), 0);
    const balance = Number(doc.total) - paymentsSum;

    // Generate a "scan to pay" QR for unpaid invoices/billing notes (#7)
    // — encodes brand bankInfo + reference code + outstanding balance so the
    // customer can scan into any banking app that reads free-text QR.
    const brand = await getBrand();
    const showsQr = brand.bankInfo
      && (doc.docType === "INVOICE" || doc.docType === "BILLING_NOTE")
      && balance > 0;
    const qrPayload = showsQr
      ? `${brand.companyName}\n${brand.bankInfo}\nRef: ${doc.code}\nAmount: ${balance} ${doc.currency}`
      : "";
    const paymentQrDataUrl = showsQr ? await generateQRDataUrl(qrPayload, 260) : null;

    const data: FinancePDFData = {
      code: doc.code,
      docType: doc.docType,
      language: lang,
      currency: doc.currency as CurrencyCode,
      issueDate: doc.issuedAt.toISOString(),
      paidAt: doc.paidAt ? doc.paidAt.toISOString() : null,
      customer: customer ? {
        name: customer.name, companyName: customer.companyName,
        phone: customer.phone, address: customer.address, taxId: customer.taxId
      } : payload.customer ?? null,
      items: payload.items ?? [],
      quotationCode: payload.quotationCode ?? null,
      jobCode: job?.code ?? null,
      amount: Number(doc.amount),
      taxPercent: payload.taxPercent ?? 0,
      taxAmount: Number(doc.taxAmount),
      total: Number(doc.total),
      payments: doc.payments.map((p) => ({
        amount: Number(p.amount),
        method: p.method,
        reference: p.reference,
        receivedAt: p.receivedAt.toISOString()
      })),
      balance: Math.max(0, balance),
      note: payload.note ?? null,
      brand,
      paymentQrDataUrl
    };

    const buffer = await renderToBuffer(<FinanceDocumentPDF data={data} />);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${doc.docType}-${doc.code}.pdf"`,
        "Content-Length": String(buffer.length)
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: "PDF render failed", detail: err?.message }, { status: 500 });
  }
}
