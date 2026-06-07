import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { PurchaseOrderPDF, type POPDFData } from "@/lib/pdf/purchase-order-pdf";
import { getBrand } from "@/lib/brand";
import type { Locale } from "@/lib/i18n/config";
import type { CurrencyCode } from "@/lib/currency";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const lang = (req.nextUrl.searchParams.get("lang") as Locale) || "lo";
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: { items: { orderBy: { sortOrder: "asc" } } }
    });
    if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data: POPDFData = {
      code: po.code,
      status: po.status,
      language: lang,
      currency: po.currency as CurrencyCode,
      issueDate: po.issueDate.toISOString(),
      expectedDate: po.expectedDate ? po.expectedDate.toISOString() : null,
      supplier: {
        name: po.supplierName,
        address: po.supplierAddress,
        phone: po.supplierPhone,
        email: po.supplierEmail,
        taxId: po.supplierTaxId
      },
      items: po.items.map((it) => ({
        description: it.description,
        quantity: Number(it.quantity),
        unit: it.unit,
        unitPrice: Number(it.unitPrice),
        lineTotal: Number(it.lineTotal),
        note: it.note
      })),
      subtotal: Number(po.subtotal),
      taxPercent: Number(po.taxPercent),
      taxAmount: Number(po.taxAmount),
      shipping: Number(po.shipping),
      total: Number(po.total),
      note: po.note,
      termsText: po.termsText,
      brand: await getBrand()
    };

    const buffer = await renderToBuffer(<PurchaseOrderPDF data={data} />);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="PO-${po.code}.pdf"`,
        "Content-Length": String(buffer.length)
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: "PDF render failed", detail: err?.message }, { status: 500 });
  }
}
