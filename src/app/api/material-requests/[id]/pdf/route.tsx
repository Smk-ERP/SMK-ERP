import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { MaterialRequestPDF, type MRPDFData } from "@/lib/pdf/material-request-pdf";
import { getBrand } from "@/lib/brand";
import type { Locale } from "@/lib/i18n/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const lang = (req.nextUrl.searchParams.get("lang") as Locale) || "lo";
    const mr = await prisma.materialRequest.findUnique({
      where: { id: params.id },
      include: {
        job: { include: { customer: true } },
        requestedBy: true,
        items: { include: { material: true } }
      }
    });
    if (!mr) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data: MRPDFData = {
      code: mr.code,
      status: mr.status,
      createdAt: mr.createdAt.toISOString(),
      language: lang,
      job: { code: mr.job.code, customer: mr.job.customer.name },
      requester: mr.requestedBy.fullName,
      note: mr.note,
      items: mr.items.map((it) => ({
        code: it.material.code, name: it.material.name,
        quantity: Number(it.quantity), unit: it.unit
      })),
      brand: await getBrand()
    };

    const buffer = await renderToBuffer(<MaterialRequestPDF data={data} />);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="MR-${mr.code}.pdf"`,
        "Content-Length": String(buffer.length)
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: "PDF render failed", detail: err?.message }, { status: 500 });
  }
}
