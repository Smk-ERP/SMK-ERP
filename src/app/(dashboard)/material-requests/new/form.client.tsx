"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { useI18n } from "@/lib/i18n/context";
import { Plus, Trash2 } from "lucide-react";

interface Job { id: string; code: string; customer: string; status: string }
interface Material { id: string; code: string; name: string; unit: string; stockQty: number; unitCost: number; currency: string }
interface Line { materialId: string; quantity: number; unit: string }

export function NewMRForm({ jobs, materials, initialJobId }: { jobs: Job[]; materials: Material[]; initialJobId?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [jobId, setJobId] = useState(initialJobId ?? jobs[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function addLine() {
    if (materials.length === 0) return;
    setItems((prev) => [...prev, { materialId: materials[0].id, quantity: 1, unit: materials[0].unit }]);
  }
  function updateLine(idx: number, patch: Partial<Line>) {
    setItems((prev) => prev.map((it, i) => {
      if (i !== idx) return it;
      const next = { ...it, ...patch };
      if (patch.materialId) {
        const m = materials.find((m) => m.id === patch.materialId);
        if (m) next.unit = m.unit;
      }
      return next;
    }));
  }
  function removeLine(idx: number) { setItems((prev) => prev.filter((_, i) => i !== idx)); }

  async function submit() {
    setBusy(true); setErr(null);
    try {
      if (!jobId || items.length === 0) throw new Error("Pick a job and add at least one item");
      const res = await fetch("/api/material-requests", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, note, items })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Save failed");
      router.push(`/material-requests/${j.request.id}`);
    } catch (e: any) { setErr(e.message); setBusy(false); }
  }

  return (
    <div>
      <PageHeader
        title={t("materialRequest.new")}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "/dashboard" },
          { label: t("materialRequest.title"), href: "/material-requests" },
          { label: t("materialRequest.new") }
        ]}
      />

      <Card className="mb-4">
        <CardHeader><CardTitle>Header</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>{t("materialRequest.job")}</Label>
            <Select value={jobId} onChange={(e) => setJobId(e.target.value)}>
              <option value="">—</option>
              {jobs.map((j) => <option key={j.id} value={j.id}>{j.code} — {j.customer} [{j.status}]</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Note</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{t("materialRequest.items")}</CardTitle>
          <Button size="sm" onClick={addLine}><Plus className="h-4 w-4" /> {t("materialRequest.addItem")}</Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No items — click "{t("materialRequest.addItem")}"</p>
          ) : (
            <div className="space-y-2">
              {items.map((it, i) => {
                const mat = materials.find((m) => m.id === it.materialId);
                const insufficient = mat && it.quantity > mat.stockQty;
                return (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-7 space-y-1">
                      <Label className="text-xs">Material</Label>
                      <Select value={it.materialId} onChange={(e) => updateLine(i, { materialId: e.target.value })}>
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.code} — {m.name} ({m.stockQty} {m.unit} in stock)
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="col-span-3 space-y-1">
                      <Label className="text-xs">Qty ({it.unit})</Label>
                      <Input type="number" step="0.01" value={it.quantity} onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })} className={insufficient ? "border-rose-500" : ""} />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <Button size="icon" variant="ghost" onClick={() => removeLine(i)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    {insufficient && <p className="col-span-12 text-xs text-rose-600 -mt-1">⚠ Requested {it.quantity} but only {mat?.stockQty} in stock</p>}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-end gap-2">
          {err && <p className="text-rose-600 text-sm mr-auto">{err}</p>}
          <Button variant="outline" onClick={() => router.back()}>{t("common.cancel")}</Button>
          <Button disabled={busy || items.length === 0} onClick={submit} size="lg">{busy ? t("common.loading") : t("common.save")}</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
