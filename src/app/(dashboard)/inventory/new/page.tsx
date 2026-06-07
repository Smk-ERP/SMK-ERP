"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { useI18n } from "@/lib/i18n/context";
import { UNIT_TYPES, CURRENCIES } from "@/lib/enums";

export default function NewMaterialPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", code: "", category: "", unit: "SHEET" as string,
    unitCost: 0, currency: "THB", stockQty: 0, reorderLevel: 5
  });
  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });
  const setNum = (k: string) => (e: any) => setForm({ ...form, [k]: Number(e.target.value) });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    try {
      const res = await fetch("/api/materials", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Save failed");
      router.push(`/inventory/${j.material.id}`);
    } catch (e: any) { setErr(e.message); setLoading(false); }
  }

  return (
    <form onSubmit={onSubmit}>
      <PageHeader
        title={t("inventory.newMaterial")}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "/dashboard" },
          { label: t("inventory.title"), href: "/inventory" },
          { label: t("inventory.newMaterial") }
        ]}
      />

      <Card>
        <CardHeader><CardTitle>{t("inventory.newMaterial")}</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>{t("inventory.code")} <span className="text-xs text-muted-foreground">(auto if empty)</span></Label><Input value={form.code} onChange={set("code")} placeholder="MAT-VINYL-XYZ" /></div>
          <div className="space-y-1.5"><Label>{t("inventory.name")} *</Label><Input value={form.name} onChange={set("name")} required /></div>
          <div className="space-y-1.5"><Label>{t("inventory.category")}</Label><Input value={form.category} onChange={set("category")} placeholder="Vinyl / ACP / LED…" /></div>
          <div className="space-y-1.5">
            <Label>{t("inventory.unit")}</Label>
            <Select value={form.unit} onChange={set("unit")}>
              {UNIT_TYPES.map((u) => <option key={u} value={u}>{u}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("inventory.unitCost")}</Label>
            <Input type="number" step="0.01" value={form.unitCost} onChange={setNum("unitCost")} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("common.currency")}</Label>
            <Select value={form.currency} onChange={set("currency")}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5"><Label>{t("inventory.stockQty")}</Label><Input type="number" step="0.01" value={form.stockQty} onChange={setNum("stockQty")} /></div>
          <div className="space-y-1.5"><Label>{t("inventory.reorderLevel")}</Label><Input type="number" step="0.01" value={form.reorderLevel} onChange={setNum("reorderLevel")} /></div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          {err && <p className="text-rose-600 text-sm mr-auto">{err}</p>}
          <Button type="button" variant="outline" onClick={() => router.back()}>{t("common.cancel")}</Button>
          <Button type="submit" disabled={loading} size="lg">{loading ? t("common.loading") : t("common.save")}</Button>
        </CardFooter>
      </Card>
    </form>
  );
}
