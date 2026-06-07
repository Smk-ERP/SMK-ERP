"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";
import { fmtDateTime } from "@/lib/utils";
import { Check, Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notif {
  id: string; type: string; title: string; body: string | null; link: string | null;
  read: boolean; createdAt: string;
}

export function NotificationsList({ initial }: { initial: Notif[] }) {
  const { t } = useI18n();
  const [items, setItems] = useState(initial);

  async function markAll() {
    await fetch("/api/notifications", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true })
    });
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }
  async function markOne(id: string) {
    await fetch("/api/notifications", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] })
    });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  const unread = items.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        title={t("notifications.title")}
        subtitle={`${unread} unread • ${items.length} total`}
        breadcrumb={[{ label: t("nav.dashboard"), href: "/dashboard" }, { label: t("notifications.title") }]}
        action={unread > 0 ? <Button onClick={markAll}><Check className="h-4 w-4" />{t("notifications.markAllRead")}</Button> : null}
      />

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BellOff className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">{t("notifications.noNew")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const Inner = (
              <div className="flex items-start gap-3 p-4">
                <span className={cn("mt-1.5 h-2.5 w-2.5 rounded-full shrink-0", n.read ? "bg-slate-300" : "bg-cyan-500")} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{n.title}</h3>
                    <Badge variant="muted" className="text-[10px]">{n.type}</Badge>
                  </div>
                  {n.body && <p className="text-sm text-muted-foreground mt-1">{n.body}</p>}
                  <p className="text-xs text-muted-foreground mt-2">{fmtDateTime(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <button onClick={(e) => { e.preventDefault(); markOne(n.id); }} className="text-xs text-cyan-700 hover:underline">
                    Mark read
                  </button>
                )}
              </div>
            );
            const cls = cn("rounded-lg border bg-card transition-colors hover:bg-muted/30", !n.read && "border-cyan-200 bg-cyan-50/30");
            return n.link ? (
              <Link key={n.id} href={n.link} className={cls + " block"} onClick={() => markOne(n.id)}>{Inner}</Link>
            ) : (
              <div key={n.id} className={cls}>{Inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
