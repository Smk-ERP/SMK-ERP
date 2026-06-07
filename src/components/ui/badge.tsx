import * as React from "react";
import { cn } from "@/lib/utils";

const STATUS_CLASS: Record<string, string> = {
  // Quotation
  DRAFT:      "badge-draft",
  SENT:       "badge-sent",
  APPROVED:   "badge-approved",
  REJECTED:   "badge-rejected",
  CONVERTED:  "badge-converted",
  EXPIRED:    "badge-expired",
  // Job
  NEW:                "badge-draft",
  CONFIRMED:          "badge-sent",
  DESIGN:             "badge-converted",
  WAITING_MATERIAL:   "badge-warning",
  PRODUCTION:         "badge-progress",
  QC:                 "badge-warning",
  REWORK:             "badge-danger",
  READY_TO_INSTALL:   "badge-sent",
  INSTALLING:         "badge-progress",
  DELIVERED:          "badge-success",
  COMPLETED:          "badge-success",
  CANCELLED:          "badge-danger"
};

export function StatusBadge({ status, label, className }: { status: string; label?: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        STATUS_CLASS[status] ?? "badge-draft",
        className
      )}
    >
      {label ?? status}
    </span>
  );
}

export function Badge({ className, children, variant = "default" }: { className?: string; children: React.ReactNode; variant?: "default" | "outline" | "muted" }) {
  const v =
    variant === "outline"
      ? "border border-border bg-transparent text-foreground"
      : variant === "muted"
      ? "bg-muted text-muted-foreground"
      : "bg-primary text-primary-foreground";
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", v, className)}>{children}</span>;
}
