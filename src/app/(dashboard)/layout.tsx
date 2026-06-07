import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ChatWidget } from "@/components/layout/chat-widget";
import { getCurrentUser, isDemoMode } from "@/lib/auth";
import { getBrand } from "@/lib/brand";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, brand] = await Promise.all([getCurrentUser(), getBrand()]);
  if (!user && !isDemoMode()) redirect("/login");

  const sidebarBrand = {
    companyName: brand.companyName,
    tagline: brand.tagline,
    logoUrl: brand.logoUrl
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar brand={sidebarBrand} userName={user?.fullName ?? "Demo User"} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
      <ChatWidget userName={user?.fullName} userRole={user?.role} />
    </div>
  );
}
