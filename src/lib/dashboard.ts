import { prisma } from "./prisma";
import { JOB_STATUSES, type JobStatus, type Currency } from "./enums";

export interface DashboardStats {
  monthSales: number;
  pendingJobs: number;
  lateJobs: number;
  qcWaiting: number;
  installWaiting: number;
  revenue: number;
  cost: number;
  grossProfit: number;
  jobStatusBreakdown: { status: JobStatus; count: number }[];
  salesByChannel: { channel: string; total: number }[];
  currency: Currency;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Approved/Converted quotations this month = "sales"
  const monthQuotes = await prisma.quotation.findMany({
    where: {
      status: { in: ["APPROVED", "CONVERTED"] },
      issueDate: { gte: start, lt: end }
    },
    include: { customer: true, items: true }
  });

  const monthSales = monthQuotes.reduce((s, q) => s + Number(q.total), 0);

  const jobs = await prisma.job.findMany({});
  const inProduction: JobStatus[] = [
    "NEW", "CONFIRMED", "DESIGN", "WAITING_MATERIAL", "PRODUCTION"
  ];
  const pendingJobs = jobs.filter((j) => inProduction.includes(j.status as JobStatus)).length;
  const today = new Date();
  const lateJobs = jobs.filter(
    (j) =>
      j.dueDate &&
      j.dueDate < today &&
      !["COMPLETED", "DELIVERED", "CANCELLED"].includes(j.status)
  ).length;
  const qcWaiting = jobs.filter((j) => j.status === "QC").length;
  const installWaiting = jobs.filter((j) => j.status === "READY_TO_INSTALL").length;

  // Revenue/cost: from quotation items snapshot
  let revenue = 0;
  let cost = 0;
  for (const q of monthQuotes) {
    for (const it of q.items) {
      revenue += Number(it.lineTotal);
      cost += Number(it.unitCost) * Number(it.quantity);
    }
  }

  const jobStatusBreakdown = JOB_STATUSES.map((s) => ({
    status: s,
    count: jobs.filter((j) => j.status === s).length
  }));

  // Sales by customer.type — proxy for channel
  const salesAgg = new Map<string, number>();
  for (const q of monthQuotes) {
    const key = q.customer?.type ?? "OTHER";
    salesAgg.set(key, (salesAgg.get(key) ?? 0) + Number(q.total));
  }
  const salesByChannel = Array.from(salesAgg.entries()).map(([channel, total]) => ({ channel, total }));

  const currency: Currency = (monthQuotes[0]?.currency as Currency) ?? "LAK";

  return {
    monthSales,
    pendingJobs,
    lateJobs,
    qcWaiting,
    installWaiting,
    revenue,
    cost,
    grossProfit: revenue - cost,
    jobStatusBreakdown,
    salesByChannel,
    currency
  };
}
