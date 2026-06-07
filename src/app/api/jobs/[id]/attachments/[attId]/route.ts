import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: NextRequest, { params }: { params: { id: string; attId: string } }) {
  const att = await prisma.jobAttachment.findUnique({
    where: { id: params.attId },
    include: { fileAsset: true }
  });
  if (!att || att.jobId !== params.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.jobAttachment.delete({ where: { id: params.attId } });
  // Orphan file asset cleanup
  await prisma.fileAsset.delete({ where: { id: att.fileAssetId } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
