import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const Input = z.object({
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  beforePhotos: z.array(z.string()).optional(),
  afterPhotos: z.array(z.string()).optional(),
  signatureUrl: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  scheduledAt: z.string().nullable().optional()
});

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const inst = await prisma.installation.findUnique({
    where: { id: params.id },
    include: { job: { include: { customer: true } }, owner: true }
  });
  if (!inst) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ installation: inst });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Input.parse(await req.json());

  // ─── Enforce completion guards: before+after photos + customer signature ───
  if (parsed.status === "COMPLETED") {
    // Look at the current state PLUS the in-flight update payload to decide
    const current = await prisma.installation.findUnique({ where: { id: params.id } });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const parseList = (s: string | null | undefined) => {
      if (!s) return [];
      try { return JSON.parse(s); } catch { return []; }
    };
    const beforeFinal = parsed.beforePhotos ?? parseList(current.beforePhotos as any);
    const afterFinal = parsed.afterPhotos ?? parseList(current.afterPhotos as any);
    const sigFinal = parsed.signatureUrl !== undefined ? parsed.signatureUrl : current.signatureUrl;

    const missing: string[] = [];
    if (!beforeFinal || beforeFinal.length === 0) missing.push("before photo");
    if (!afterFinal || afterFinal.length === 0) missing.push("after photo");
    if (!sigFinal) missing.push("customer signature");

    if (missing.length > 0) {
      return NextResponse.json({
        error: "Cannot complete installation: missing " + missing.join(", "),
        missing
      }, { status: 400 });
    }
  }

  const data: any = {};
  if (parsed.status) data.status = parsed.status;
  if (parsed.status === "COMPLETED") data.completedAt = new Date();
  if (parsed.beforePhotos) data.beforePhotos = JSON.stringify(parsed.beforePhotos);
  if (parsed.afterPhotos) data.afterPhotos = JSON.stringify(parsed.afterPhotos);
  if (parsed.signatureUrl !== undefined) data.signatureUrl = parsed.signatureUrl;
  if (parsed.note !== undefined) data.note = parsed.note;
  if (parsed.scheduledAt !== undefined) data.scheduledAt = parsed.scheduledAt ? new Date(parsed.scheduledAt) : null;

  const inst = await prisma.installation.update({ where: { id: params.id }, data });

  // When completed, also advance the job
  if (parsed.status === "COMPLETED") {
    const job = await prisma.job.findUnique({ where: { id: inst.jobId } });
    if (job && job.status !== "COMPLETED") {
      await prisma.job.update({ where: { id: inst.jobId }, data: { status: "DELIVERED" } });
      await prisma.jobStatusHistory.create({
        data: {
          jobId: inst.jobId, fromStatus: job.status, toStatus: "DELIVERED",
          changedById: user.id, note: "Installation completed"
        }
      });
    }
  }

  return NextResponse.json({ installation: inst });
}
