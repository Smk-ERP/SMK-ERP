"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, FileText, Calculator, Briefcase,
  Factory, Package, ClipboardList, ShoppingCart, ShieldCheck, Wrench,
  BadgeDollarSign, BarChart3, ScrollText, Lock, Settings, LogOut
} from "lucide-react";

const NAV: { href: string; key: string; icon: any; phase: 1 | 2 | 3 }[] = [
  { href: "/dashboard",         key: "nav.dashboard",       icon: LayoutDashboard, phase: 1 },
  { href: "/customers",         key: "nav.customers",       icon: Users,           phase: 1 },
  { href: "/quotations",        key: "nav.quotations",      icon: FileText,        phase: 1 },
  { href: "/calculator",        key: "nav.calculator",      icon: Calculator,      phase: 1 },
  { href: "/jobs",              key: "nav.jobs",            icon: Briefcase,       phase: 1 },
  { href: "/production",        key: "nav.production",      icon: Factory,         phase: 2 },
  { href: "/inventory",         key: "nav.inventory",       icon: Package,         phase: 2 },
  { href: "/material-requests", key: "nav.materialRequest", icon: ClipboardList,   phase: 2 },
  { href: "/purchase-orders",   key: "nav.purchaseOrder",   icon: ShoppingCart,    phase: 2 },
  { href: "/qc",                key: "nav.qc",              icon: ShieldCheck,     phase: 2 },
  { href: "/installation",      key: "nav.installation",    icon: Wrench,          phase: 2 },
  { href: "/finance",           key: "nav.finance",         icon: BadgeDollarSign, phase: 3 },
  { href: "/kpi",               key: "nav.kpi",             icon: BarChart3,       phase: 3 },
  { href: "/audit",             key: "nav.audit",           icon: ScrollText,      phase: 3 },
  { href: "/rbac",              key: "nav.rbac",            icon: Lock,            phase: 3 },
  { href: "/settings",          key: "nav.settings",        icon: Settings,        phase: 1 }
];

export interface BrandHeader {
  companyName: string;
  tagline: string | null;
  logoUrl: string | null;
}

export function Sidebar({ brand, userName }: { brand?: BrandHeader; userName?: string }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const name = brand?.companyName ?? t("brand.name");
  const tagline = brand?.tagline ?? t("brand.tagline");

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-brand-navyDeep text-slate-100">
      <div className="px-6 py-6 flex items-center gap-3">
        {brand?.logoUrl ? (
          <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center overflow-hidden shadow">
            <img src={brand.logoUrl} alt={name} className="max-h-full max-w-full object-contain" />
          </div>
        ) : (
          <div className="h-10 w-10 rounded-lg brand-gradient flex items-center justify-center text-white font-black text-lg shadow">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-extrabold text-lg leading-none truncate" title={name}>{name}</div>
          <div className="text-xs text-slate-400 mt-1 line-clamp-1" title={tagline}>{tagline}</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6 space-y-0.5">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = pathname === n.href || pathname.startsWith(n.href + "/");
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{t(n.key)}</span>
              {/* All phases now active; no badge */}
            </Link>
          );
        })}
      </nav>

      {userName && (
        <div className="px-4 py-3 border-t border-white/10 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-white truncate">{userName}</div>
          </div>
        </div>
      )}

      <form action="/api/auth/logout" method="post" className="px-3 pb-4">
        <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
          <LogOut className="h-5 w-5" /> {t("nav.logout")}
        </button>
      </form>
    </aside>
  );
}
