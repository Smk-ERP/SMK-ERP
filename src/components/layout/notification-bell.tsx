"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, Check, Inbox } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { fmtDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/notifications?limit=10", { cache: "no-store" });
      const j = await res.json();
      setItems(j.notifications ?? []);
      setUnread(j.unread ?? 0);
    } catch {}
  }

  // Initial + poll every 30s
  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  // Close on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true })
    });
    load();
  }

  async function markOne(id: string) {
    await fetch("/api/notifications", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] })
    });
    load();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative h-10 w-10 rounded-lg border hover:bg-accent flex items-center justify-center"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 h-4 min-w-[16px] rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg border shadow-lg z-40 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold">{t("notifications.title")}</h3>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-cyan-700 hover:underline inline-flex items-center gap-1">
                <Check className="h-3 w-3" />{t("notifications.markAllRead")}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
                {t("notifications.noNew")}
              </div>
            ) : (
              items.map((n) => {
                const Content = (
                  <>
                    <div className="flex items-start gap-2">
                      <span className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", n.read ? "bg-transparent" : "bg-cyan-500")} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{n.title}</div>
                        {n.body && <div className="text-xs text-muted-foreground line-clamp-2">{n.body}</div>}
                        <div className="text-[10px] text-muted-foreground mt-1">{fmtDateTime(n.createdAt)}</div>
                      </div>
                    </div>
                  </>
                );
                const cls = cn(
                  "block px-4 py-3 border-b last:border-0 hover:bg-muted/40 transition-colors text-left w-full",
                  !n.read && "bg-cyan-50/40"
                );
                return n.link ? (
                  <Link key={n.id} href={n.link} className={cls} onClick={() => { markOne(n.id); setOpen(false); }}>{Content}</Link>
                ) : (
                  <button key={n.id} className={cls} onClick={() => markOne(n.id)}>{Content}</button>
                );
              })
            )}
          </div>

          <div className="border-t bg-muted/20 px-4 py-2 text-center">
            <Link href="/notifications" className="text-xs text-cyan-700 hover:underline" onClick={() => setOpen(false)}>
              {t("notifications.viewAll")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
