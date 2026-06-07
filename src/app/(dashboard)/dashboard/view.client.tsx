"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { JobStatusChart, SalesByChannelChart } from "@/components/dashboard/charts";
import { PageHeader } from "@/components/ui/page-header";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney, type CurrencyCode } from "@/lib/currency";
import { TrendingUp, Briefcase, AlertTriangle, ShieldCheck, Wrench, Wallet } from "lucide-react";
import type { DashboardStats } from "@/lib/dashboard";

export function DashboardView({ stats }: { stats: DashboardStats }) {
  const { t, locale } = useI18n();

  const jobChartData = stats.jobStatusBreakdown.map((s) => ({
    status: s.status,
    count: s.count,
    label: t(`job.status.${s.status}`)
  }));
  const channelData = stats.salesByChannel.map((s) => ({
    channel: s.channel,
    total: s.total,
    label: t(`customer.types.${s.channel}`)
  }));

  return (
    <div>
      <PageHeader title={t("dashboard.title")} subtitle={t("brand.tagline")} />

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6">
        <StatCard
          label={t("dashboard.monthSales")}
          value={formatMoney(stats.monthSales, stats.currency as CurrencyCode, locale)}
          tone="primary"
          icon={<TrendingUp className="h-5 w-5 text-cyan-600" />}
        />
        <StatCard
          label={t("dashboard.pendingJobs")}
          value={String(stats.pendingJobs)}
          tone="default"
          icon={<Briefcase className="h-5 w-5 text-slate-600" />}
        />
        <StatCard
          label={t("dashboard.lateJobs")}
          value={String(stats.lateJobs)}
          tone="danger"
          icon={<AlertTriangle className="h-5 w-5 text-rose-600" />}
        />
        <StatCard
          label={t("dashboard.qcWaiting")}
          value={String(stats.qcWaiting)}
          tone="warning"
          icon={<ShieldCheck className="h-5 w-5 text-amber-600" />}
        />
        <StatCard
          label={t("dashboard.installWaiting")}
          value={String(stats.installWaiting)}
          tone="warning"
          icon={<Wrench className="h-5 w-5 text-amber-600" />}
        />
        <StatCard
          label={t("dashboard.grossProfit")}
          value={formatMoney(stats.grossProfit, stats.currency as CurrencyCode, locale)}
          tone="success"
          icon={<Wallet className="h-5 w-5 text-emerald-600" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader><CardTitle>{t("dashboard.revenue")}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">
              {formatMoney(stats.revenue, stats.currency as CurrencyCode, locale)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t("dashboard.cost")}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-rose-600">
              {formatMoney(stats.cost, stats.currency as CurrencyCode, locale)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t("dashboard.grossProfit")}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-cyan-600">
              {formatMoney(stats.grossProfit, stats.currency as CurrencyCode, locale)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t("dashboard.jobStatusChart")}</CardTitle></CardHeader>
          <CardContent>
            <JobStatusChart data={jobChartData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t("dashboard.salesByChannel")}</CardTitle></CardHeader>
          <CardContent>
            <SalesByChannelChart data={channelData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
