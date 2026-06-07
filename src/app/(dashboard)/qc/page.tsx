import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { QCListClient } from "./list.client";

export const dynamic = "force-dynamic";

export default async function QCPage() {
  const checks = await prisma.qCChecklist.findMany({
    include: {
      job: { include: { customer: true } },
      result: { include: { inspectedBy: true, rework: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  const pendingJobs = await prisma.job.findMany({
    where: { status: "QC" },
    include: { customer: true },
    orderBy: { dueDate: "asc" }
  });

  return (
    <QCListClient
      pending={pendingJobs.map((j) => ({
        id: j.id, code: j.code, customer: j.customer.name,
        dueDate: j.dueDate ? j.dueDate.toISOString() : null
      }))}
      history={checks.map((c) => ({
        id: c.id,
        jobCode: c.job.code,
        jobId: c.job.id,
        customer: c.job.customer.name,
        result: c.result?.status ?? "PENDING",
        inspector: c.result?.inspectedBy?.fullName ?? "—",
        reworkResolved: c.result?.rework?.resolved ?? null,
        createdAt: c.createdAt.toISOString()
      }))}
    />
  );
}
