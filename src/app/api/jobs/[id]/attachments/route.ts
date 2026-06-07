import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Multipart upload — accepts one or more files via form-data field "files".
// Stores file contents as data URLs on FileAsset.url (Phase 1 demo storage,
// no Supabase Storage required). Swap to a real bucket later by replacing
// the body of POST with a Supabase upload + public URL.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const job = await prisma.job.findUnique({ where: { id: params.id } });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });

  const files = form.getAll("files") as File[];
  if (files.length === 0) return NextResponse.json({ error: "No files" }, { status: 400 });

  const created = [];
  for (const f of files) {
    if (!(f instanceof File)) continue;
    if (f.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: `${f.name}: file too large (max 8 MB)` }, { status: 400 });
    }
    const buf = Buffer.from(await f.arrayBuffer());
    const dataUrl = `data:${f.type || "application/octet-stream"};base64,${buf.toString("base64")}`;

    const asset = await prisma.fileAsset.create({
      data: {
        url: dataUrl,
        mimeType: f.type || null,
        sizeBytes: f.size,
        caption: f.name,
        uploaderId: user.id
      }
    });
    const att = await prisma.jobAttachment.create({
      data: {
        jobId: params.id,
        fileAssetId: asset.id,
        caption: f.name
      },
      include: { fileAsset: true }
    });
    created.push(att);
  }

  return NextResponse.json({ attachments: created });
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const atts = await prisma.jobAttachment.findMany({
    where: { jobId: params.id },
    include: { fileAsset: true },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json({
    attachments: atts.map((a) => ({
      id: a.id,
      caption: a.caption,
      createdAt: a.createdAt.toISOString(),
      mimeType: a.fileAsset.mimeType,
      sizeBytes: a.fileAsset.sizeBytes,
      url: a.fileAsset.url
    }))
  });
}
