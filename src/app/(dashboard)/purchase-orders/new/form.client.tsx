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
import { CURRENCIES, UNIT_TYPES } from "@/lib/enums";
import { formatMoney, type CurrencyCode } from "@/lib/currency";
import { Plus, Trash2, ShoppingCart } from "lucide-react";

interface Material { id: string; code: string; name: string; unit: string; unitCost: number; currency: string }
interface Line { materialId?: string; description: string; quantity: number; unit: string; unitPrice: number; note?: string }

export function NewPOForm({
  materials,
  prefillItems,
  jobId,
  materialRequestId
}: {
  materials: Material[];
  prefillItems: { description: string; quantity: number; unit: string; materialId?: string }[];
  jobId?: string;
  materialRequestId?: string;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();

  const [supplier, setSupplier] = useState({
    name: "", address: "", phone: "", email: "", taxId: ""
  });
  const [currency, setCurrency] = useState<CurrencyCode>("LAK");
  const [language, setLanguage] = useState<"lo" | "th" | "en">("lo");
  const [expectedDate, setExpectedDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
  const [shipping, setShipping] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [note, setNote] = useState("");
  const [terms, setTerms] = useState("");
  const [items, setItems] = useState<Line[]>(prefillItems.map(p => ({ ...p, unitPrice: 0 })));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function addItem() {
    setItems([...items, { description: "", quantity: 1, unit: "PCS", unitPrice: 0 }]);
  }
  function pickMaterial(idx: number, materialId: string) {
    const m = materials.find(m => m.id === materialId);
    if (!m) {
      updateItem(idx, { materialId: undefined });
      return;
    }
    updateItem(idx, {
      materialId,
      description: `${m.code} — ${m.name}`,
      unit: m.unit,
      unitPrice: m.unitCost || 0
    });
  }
  function updateItem(idx: number, patch: Partial<Line>) {
    setItems(items.map((it, i) => i === idx ? { ...it, ...patch } : it));
  }
  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }

  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const taxBase = subtotal + shipping;
  const taxAmount = taxBase * (taxPercent / 100);
  const total = taxBase + taxAmount;

  async function save() {
    setBusy(true); setErr(null);
    try {
      if (!supplier.name) throw new Error("Supplier name is required");
      if (items.length === 0) throw new Error("Add at least one item");
      const res = await fetch("/api/purchase-orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierName: supplier.name,
          supplierAddress: supplier.address || null,
          supplierPhone: supplier.phone || null,
          supplierEmail: supplier.email || null,
          supplierTaxId: supplier.taxId || null,
          currency, language, expectedDate,
          taxPercent, shipping,
          note, termsText: terms,
          jobId, materialRequestId,
          items
        })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Save failed");
      router.push(`/purchase-orders/${j.order.id}`);
    } catch (e: any) { setErr(e.message); setBusy(false); }
  }

  return (
    <div>
      <PageHeader
        title={t("po.new")}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "/dashboard" },
          { label: t("po.title"), href: "/purchase-orders" },
          { label: t("po.new") }
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>{t("po.supplier")}</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2"><Label>{t("po.supplierName")} *</Label><Input value={supplier.name} onChange={(e) => setSupplier({...supplier, name: e.target.value})} placeholder="ACP Materials Co." /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>{t("po.supplierAddress")}</Label><Input value={supplier.address} onChange={(e) => setSupplier({...supplier, address: e.target.value})} /></div>
            <div className="space-y-1.5"><Label>{t("po.supplierPhone")}</Label><Input value={supplier.phone} onChange={(e) => setSupplier({...supplier, phone: e.target.value})} /></div>
            <div className="space-y-1.5"><Label>{t("po.supplierEmail")}</Label><Input type="email" value={supplier.email} onChange={(e) => setSupplier({...supplier, email: e.target.value})} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>{t("po.supplierTaxId")}</Label><Input value={supplier.taxId} onChange={(e) => setSupplier({...supplier, taxId: e.target.value})} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Header</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t("common.currency")}</Label>
              <Select value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>PDF {t("common.language")}</Label>
              <Select value={language} onChange={(e) => setLanguage(e.target.value as any)}>
                <option value="lo">ລາວ</option>
                <option value="th">ไทย</option>
                <option value="en">English</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("po.expectedDate")}</Label>
              <Input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle><ShoppingCart className="inline h-5 w-5 mr-2" />Items</CardTitle>
          <Button size="sm" onClick={addItem}><Plus className="h-3 w-3" /> Add item</Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No items — click Add item</p>
          ) : (
            <div className="space-y-3">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 rounded-lg border bg-muted/20">
                  <div className="col-span-12 sm:col-span-4 space-y-1">
                    <Label className="text-xs">{t("po.linkMaterial")} <span className="text-muted-foreground">(optional)</span></Label>
                    <Select value={it.materialId ?? ""} onChange={(e) => pickMaterial(i, e.target.value)} className="h-9">
                      <option value="">— Free text —</option>
                      {materials.map(m => <option key={m.id} value={m.id}>{m.code} ({m.unit})</option>)}
                    </Select>
                  </div>
                  <div className="col-span-12 sm:col-span-4 space-y-1">
                    <Label className="text-xs">{t("po.itemDesc")} *</Label>
                    <Input value={it.description} onChange={(e) => updateItem(i, { description: e.target.value })} placeholder="Material description" className="h-9" />
                  </div>
                  <div className="col-span-6 sm:col-span-1 space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input type="number" step="0.01" value={it.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} className="h-9 text-right" />
                  </div>
                  <div className="col-span-6 sm:col-span-1 space-y-1">
                    <Label className="text-xs">Unit</Label>
                    <Select value={it.unit} onChange={(e) => updateItem(i, { unit: e.target.value })} className="h-9">
                      {UNIT_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
                    </Select>
                  </div>
                  <div className="col-span-10 sm:col-span-1 space-y-1">
                    <Label className="text-xs">Unit price</Label>
                    <Input type="number" step="0.01" value={it.unitPrice} onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })} className="h-9 text-right" />
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex items-end justify-end">
                    <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => removeItem(i)}>
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
                  </div>
                  <div className="col-span-12 text-right text-xs text-muted-foreground">
                    Line: <span className="font-medium text-foreground">{formatMoney(it.quantity * it.unitPrice, currency, locale)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Notes & Terms</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label>Note</Label><Textarea value={note} onChange={(e) => setNote(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Terms</Label><Textarea rows={3} value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Payment terms, delivery conditions..." /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label={t("common.subtotal")} value={formatMoney(subtotal, currency, locale)} />
            <div className="flex items-center justify-between">
              <Label className="!text-sm">{t("po.shipping")}</Label>
              <Input type="number" className="h-8 w-28 text-right" value={shipping} onChange={(e) => setShipping(Number(e.target.value))} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="!text-sm">{t("common.tax")} %</Label>
              <Input type="number" className="h-8 w-24 text-right" value={taxPercent} onChange={(e) => setTaxPercent(Number(e.target.value))} />
            </div>
            <Row label={t("common.tax")} value={formatMoney(taxAmount, currency, locale)} />
            <hr />
            <Row label={t("common.grandTotal")} value={formatMoney(total, currency, locale)} strong />
          </CardContent>
          <CardFooter className="flex-col gap-2">
            {err && <p className="text-rose-600 text-sm w-full">{err}</p>}
            <Button className="w-full" size="lg" disabled={busy || items.length === 0} onClick={save}>
              {busy ? t("common.loading") : t("common.save")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-bold text-base" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span className={strong ? "text-cyan-600" : ""}>{value}</span>
    </div>
  );
}
