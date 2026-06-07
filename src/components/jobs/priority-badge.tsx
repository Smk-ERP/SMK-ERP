"use client";

import { cn } from "@/lib/utils";
import { Flame, ArrowUp, Minus, ArrowDown } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

const STYLES: Record<string, { cls: string; Icon: any }> = {
  URGENT: { cls: "bg-rose-100 text-rose-700 border-rose-300",       Icon: Flame },
  HIGH:   { cls: "bg-amber-100 text-amber-700 border-amber-300",    Icon: ArrowUp },
  MEDIUM: { cls: "bg-slate-100 text-slate-700 border-slate-300",    Icon: Minus },
  LOW:    { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: ArrowDown }
};

export function PriorityBadge({ priority, className, withLabel = true }: { priority: string; className?: string; withLabel?: boolean }) {
  const { t } = useI18n();
  const s = STYLES[priority] ?? STYLES.MEDIUM;
  const Icon = s.Icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold", s.cls, className)}>
      <Icon className="h-3 w-3" />
      {withLabel && t(`job.priorities.${priority}`)}
    </span>
  );
}
