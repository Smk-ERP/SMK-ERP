import { prisma } from "@/lib/prisma";
import { KPIView } from "./view.client";
import { periodLabel } from "@/lib/incentive";

export const dynamic = "force-dynamic";

export default async function KPIPage({ searchParams }: { searchParams: { period?: string } }) {
  const period = searchParams.period ?? periodLabel();
  const [records, users] = await Promise.all([
    prisma.kPIRecord.findMany({
      where: { period },
      include: { user: true },
      orderBy: { totalScore: "desc" }
    }),
    prisma.user.findMany({
      where: { active: true, role: { in: ["SALES_MANAGER", "SALES_STAFF", "DESIGNER", "PRODUCTION_MANAGER"] } },
      orderBy: { fullName: "asc" }
    })
  ]);

  return (
    <KPIView
      period={period}
      records={records.map((r) => ({
        id: r.id, userId: r.userId, userName: r.user.fullName, role: r.user.role,
        kpiScore: Number(r.kpiScore), kbiScore: Number(r.kbiScore),
        totalScore: Number(r.totalScore),
        salesAmount: r.salesAmount ? Number(r.salesAmount) : 0,
        commission: r.commission ? Number(r.commission) : 0,
        note: r.note
      }))}
      users={users.map((u) => ({ id: u.id, name: u.fullName, role: u.role }))}
    />
  );
}
