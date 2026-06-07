"use client";

import { LanguageSwitcher } from "./language-switcher";
import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "./theme-toggle";
import { Search } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export function Topbar() {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b">
      <div className="flex items-center gap-3 px-4 sm:px-6 h-16">
        <div className="lg:hidden">
          <div className="h-8 w-8 rounded-md brand-gradient flex items-center justify-center text-white font-black">S</div>
        </div>

        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder={t("common.search")}
              className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <NotificationBell />
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
