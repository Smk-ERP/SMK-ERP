"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useI18n } from "@/lib/i18n/context";
import { fmtDateTime } from "@/lib/utils";
import { Search, ChevronDown } from "lucide-react";

interface Log {
  id: string; action: string; entity: string; entityId: string | null;
  actor: string; role: string | null;
  createdAt: string; after: any; before: any;
}

export function AuditLogView({ initial }: { initial: Log[] }) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [entity, setEntity] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const entities = useMemo(() => Array.from(new Set(initial.map((l) => l.entity))).sort(), [initial]);

  const rows = useMemo(() => {
    const ql = q.toLowerCase();
    return initial.filter((l) => {
      if (entity && l.entity !== entity) return false;
      if (!ql) return true;
      return l.action.toLowerCase().includes(ql) ||
             l.entity.toLowerCase().includes(ql) ||
             l.actor.toLowerCase().includes(ql) ||
             (l.entityId ?? "").includes(ql);
    });
  }, [initial, q, entity]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <PageHeader
        title={t("audit.title")}
        subtitle={`${initial.length} entries`}
        breadcrumb={[{ label: t("nav.dashboard"), href: "/dashboard" }, { label: t("audit.title") }]}
      />

      <Card className="p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder={`${t("common.search")} (action / actor / id)`} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={entity} onChange={(e) => setEntity(e.target.value)} className="sm:max-w-xs">
            <option value="">{t("audit.entity")}</option>
            {entities.map((e) => <option key={e} value={e}>{e}</option>)}
          </Select>
        </div>
      </Card>

      <Card>
        {rows.length === 0 ? (
          <EmptyState title={t("common.noData")} />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{t("common.date")}</TH>
                <TH>{t("audit.actor")}</TH>
                <TH>{t("audit.action")}</TH>
                <TH>{t("audit.entity")}</TH>
                <TH>Entity ID</TH>
                <TH></TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((l) => {
                const open = expanded.has(l.id);
                const hasData = !!(l.after || l.before);
                return (
                  <>
                    <TR key={l.id}>
                      <TD className="text-xs text-muted-foreground">{fmtDateTime(l.createdAt)}</TD>
                      <TD>
                        <div className="font-medium text-sm">{l.actor}</div>
                        {l.role && <div className="text-[10px] text-muted-foreground">{l.role}</div>}
                      </TD>
                      <TD><code className="text-xs bg-slate-100 rounded px-1.5 py-0.5">{l.action}</code></TD>
                      <TD><Badge variant="muted">{l.entity}</Badge></TD>
                      <TD className="font-mono text-[10px] text-muted-foreground">{l.entityId ?? "—"}</TD>
                      <TD>
                        {hasData && (
                          <button onClick={() => toggle(l.id)} className="text-xs text-cyan-700 hover:underline inline-flex items-center gap-1">
                            <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
                            {open ? "Hide" : "Diff"}
                          </button>
                        )}
                      </TD>
                    </TR>
                    {open && hasData && (
                      <TR key={l.id + "-diff"} className="bg-muted/30">
                        <TD className="text-xs"></TD>
                        <TD colSpan={5} className="text-xs">
                          {l.before && (
                            <details className="mb-2">
                              <summary className="cursor-pointer font-medium text-rose-700">Before</summary>
                              <pre className="mt-1 p-2 bg-white rounded text-[11px] overflow-auto">{typeof l.before === "string" ? l.before : JSON.stringify(l.before, null, 2)}</pre>
                            </details>
                          )}
                          {l.after && (
                            <details open>
                              <summary className="cursor-pointer font-medium text-emerald-700">After</summary>
                              <pre className="mt-1 p-2 bg-white rounded text-[11px] overflow-auto">{typeof l.after === "string" ? l.after : JSON.stringify(l.after, null, 2)}</pre>
                            </details>
                          )}
                        </TD>
                      </TR>
                    )}
                  </>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
