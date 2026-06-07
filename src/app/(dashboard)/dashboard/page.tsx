import { getDashboardStats } from "@/lib/dashboard";
import { DashboardView } from "./view.client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  // Pass plain serializable data to client component
  return <DashboardView stats={stats} />;
}
