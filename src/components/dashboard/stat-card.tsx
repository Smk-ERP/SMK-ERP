import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  icon
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger" | "primary";
  icon?: React.ReactNode;
}) {
  const toneClass = {
    default: "bg-card",
    primary: "bg-gradient-to-br from-cyan-50 to-cyan-100/50",
    success: "bg-gradient-to-br from-emerald-50 to-emerald-100/50",
    warning: "bg-gradient-to-br from-amber-50 to-amber-100/50",
    danger:  "bg-gradient-to-br from-rose-50 to-rose-100/50"
  }[tone];

  return (
    <Card className={cn("p-5", toneClass)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1 tracking-tight">{value}</p>
          {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
        </div>
        {icon && <div className="rounded-lg bg-white/60 p-2 shadow-sm">{icon}</div>}
      </div>
    </Card>
  );
}
