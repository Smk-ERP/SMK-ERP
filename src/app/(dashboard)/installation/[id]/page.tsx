import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { InstallationDetail } from "./detail.client";

export const dynamic = "force-dynamic";

export default async function InstallationDetailPage({ params }: { params: { id: string } }) {
  const inst = await prisma.installation.findUnique({
    where: { id: params.id },
    include: { job: { include: { customer: true } }, owner: true }
  });
  if (!inst) notFound();

  const parseJson = (s: string | null) => {
    if (!s) return [];
    try { return JSON.parse(s); } catch { return []; }
  };

  return (
    <InstallationDetail
      inst={{
        id: inst.id,
        status: inst.status,
        scheduledAt: inst.scheduledAt ? inst.scheduledAt.toISOString() : null,
        completedAt: inst.completedAt ? inst.completedAt.toISOString() : null,
        note: inst.note,
        beforePhotos: parseJson(inst.beforePhotos as any),
        afterPhotos: parseJson(inst.afterPhotos as any),
        signatureUrl: inst.signatureUrl,
        job: { id: inst.job.id, code: inst.job.code, customer: inst.job.customer.name },
        owner: inst.owner.fullName
      }}
    />
  );
}
