import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { QuotationPDF, type QuotationPDFData } from "@/lib/pdf/quotation-pdf";
import { getBrand } from "@/lib/brand";
import type { Locale } from "@/lib/i18n/config";
import type { CurrencyCode } from "@/lib/currency";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const lang = (req.nextUrl.searchParams.get("lang") as Locale) || "lo";

    const [q, brand] = await Promise.all([
      prisma.quotation.findUnique({
        where: { id: params.id },
        include: { customer: true, items: { orderBy: { sortOrder: "asc" } } }
      }),
      getBrand()
    ]);
    if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data: QuotationPDFData = {
      code: q.code,
      status: q.status,
      currency: q.currency as CurrencyCode,
      language: lang,
      issueDate: q.issueDate.toISOString(),
      validUntil: q.validUntil ? q.validUntil.toISOString() : null,
      customer: {
        name: q.customer.name,
        code: q.customer.code,
        companyName: q.customer.companyName,
        phone: q.customer.phone,
        address: q.customer.address,
        taxId: q.customer.taxId
      },
      items: q.items.map((it) => ({
        title: it.title,
        description: it.description,
        quantity: Number(it.quantity),
        unit: it.unit,
        unitPrice: Number(it.unitPrice),
        lineTotal: Number(it.lineTotal)
      })),
      subtotal: Number(q.subtotal),
      discountAmount: Number(q.discountAmount),
      discountPercent: Number(q.discountPercent),
      taxPercent: Number(q.taxPercent),
      taxAmount: Number(q.taxAmount),
      total: Number(q.total),
      note: q.note,
      termsText: q.termsText,
      brand
    };

    const buffer = await renderToBuffer(<QuotationPDF data={data} />);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Quotation-${q.code}.pdf"`,
        "Content-Length": String(buffer.length)
      }
    });
  } catch (err: any) {
    console.error("[pdf] render failed:", err);
    return NextResponse.json(
      { error: "PDF render failed", detail: err?.message ?? String(err), stack: err?.stack },
      { status: 500 }
    );
  }
}
