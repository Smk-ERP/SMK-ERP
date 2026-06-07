import { Breadcrumb, type Crumb } from "./breadcrumb";

export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  action
}: {
  title: string;
  subtitle?: string;
  breadcrumb?: Crumb[];
  action?: React.ReactNode;
}) {
  return (
    <div className="space-y-2 pb-6">
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {action && <div className="flex gap-2">{action}</div>}
      </div>
    </div>
  );
}
