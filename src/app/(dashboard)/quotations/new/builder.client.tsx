"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { CalculatorForm } from "@/components/calculator/calculator-form";
import { WorkflowSteps, quotationLifecycle } from "@/components/ui/workflow-steps";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney, convert, type CurrencyCode } from "@/lib/currency";
import { Plus, Trash2 } from "lucide-react";
import type { CalcInput, CalcResult } from "@/lib/cost-calculator";

interface Customer { id: string; name: string; code: string; companyName: string | null }

interface LineItem {
  signType: string;
  title: string;
  description?: string;
  widthMm?: number;
  heightMm?: number;
  areaSqm?: number;
  quantity: number;
  unit: string;
  unitCost: number;   // in selected currency
  unitPrice: number;  // in selected currency
  markupPercent: number;
  costBreakdown?: any;
}

export function QuotationBuilder({ customers, initialCustomerId }: { customers: Customer[]; initialCustomerId?: string }) {
  const { t, locale } = useI18n();
  const router = useRouter();

  const [customerId, setCustomerId] = useState(initialCustomerId ?? customers[0]?.id ?? "");
  const [currency, setCurrency] = useState<CurrencyCode>("LAK");
  const [language, setLanguage] = useState<"th" | "lo" | "en">("lo");
  const [validUntil, setValidUntil] = useState<string>(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [note, setNote] = useState("");
  const [terms, setTerms] = useState("ราคานี้รวมค่าผลิตและจัดส่งภายในนครหลวงเวียงจันทน์ / ชำระเงิน 50% มัดจำก่อนเริ่มผลิต");
  const [items, setItems] = useState<LineItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function addItem(input: CalcInput, result: CalcResult) {
    // result is in THB — convert to selected currency
    const unitCostCurrency = convert(result.costBeforeProfit / Math.max(1, input.quantity), "THB", currency);
    const unitPriceCurrency = convert(result.pricePerUnit, "THB", currency);
    setItems((prev) => [
      ...prev,
      {
        signType: input.signType,
        title: t(`signTypes.${input.signType}`),
        description: `${input.widthMm}×${input.heightMm} mm`,
        widthMm: input.widthMm,
        heightMm: input.heightMm,
        areaSqm: result.areaSqm,
        quantity: input.quantity,
        unit: "PCS",
        unitCost: +unitCostCurrency.toFixed(2),
        unitPrice: +unitPriceCurrency.toFixed(2),
        markupPercent: input.profitPercent ?? 30,
        costBreakdown: { input, result }
      }
    ]);
  }

  function updateItem(idx: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const subtotal = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
  const discount = subtotal * (discountPercent / 100);
  const taxable = Math.max(0, subtotal - discount);
  const tax = taxable * (taxPercent / 100);
  const total = taxable + tax;
  const cost = items.reduce((s, it) => s + it.unitCost * it.quantity, 0);
  const margin = total > 0 ? ((total - cost) / total) * 100 : 0;

  async function save() {
    setErr(null);
    if (!customerId) { setErr("Choose a customer"); return; }
    if (items.length === 0) { setErr("Add at least one item"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId, currency, language,
          validUntil,
          discountPercent, taxPercent,
          discountAmount: 0,
          note, termsText: terms,
          items
        })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Save failed");
      router.push(`/quotations/${j.quotation.id}`);
    } catch (e: any) {
      setErr(e.message);
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={t("quotation.new")}
        breadcrumb={[
          { label: t("nav.dashboard"), href: "/dashboard" },
          { label: t("quotation.title"), href: "/quotations" },
          { label: t("quotation.new") }
        ]}
      />

      {/* Workflow stepper — new quote is at DRAFT stage */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <WorkflowSteps steps={quotationLifecycle(locale)} currentKey="DRAFT" />
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader><CardTitle>Header</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label>{t("quotation.customer")}</Label>
            <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">—</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.code} — {c.name}{c.companyName ? ` (${c.companyName})` : ""}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("common.currency")}</Label>
            <Select value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}>
              <option>LAK</option><option>THB</option><option>USD</option>
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
            <Label>{t("quotation.validUntil")}</Label>
            <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader><CardTitle>{t("calculator.title")}</CardTitle></CardHeader>
        <CardContent>
          <CalculatorForm onAddToQuotation={addItem} displayCurrency={currency} />
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader><CardTitle>{t("quotation.items")}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">— Use the calculator above and click <em>{t("calculator.addToQuotation")}</em></p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-2">#</th>
                  <th className="text-left">Title</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Unit price ({currency})</th>
                  <th className="text-right">Line total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2">{i + 1}</td>
                    <td>
                      <Input value={it.title} onChange={(e) => updateItem(i, { title: e.target.value })} className="h-9" />
                      {it.description && <div className="text-xs text-muted-foreground mt-1">{it.description}</div>}
                    </td>
                    <td className="text-right">
                      <Input type="number" value={it.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} className="h-9 w-20 text-right" />
                    </td>
                    <td className="text-right">
                      <Input type="number" value={it.unitPrice} onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })} className="h-9 w-32 text-right" />
                      <div className="text-xs text-muted-foreground mt-0.5">
                        = {formatMoney(it.unitPrice, currency, locale)}
                      </div>
                    </td>
                    <td className="text-right font-medium">{formatMoney(it.unitPrice * it.quantity, currency, locale)}</td>
                    <td className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Notes / Terms</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label>Note</Label><Textarea value={note} onChange={(e) => setNote(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Terms</Label><Textarea rows={4} value={terms} onChange={(e) => setTerms(e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label={t("common.subtotal")} value={formatMoney(subtotal, currency, locale)} />
            <div className="flex items-center justify-between">
              <Label className="!text-sm">{t("common.discount")} %</Label>
              <Input type="number" className="h-9 w-24 text-right" value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} />
            </div>
            <Row label={t("common.discount")} value={`− ${formatMoney(discount, currency, locale)}`} />
            <div className="flex items-center justify-between">
              <Label className="!text-sm">{t("common.tax")} %</Label>
              <Input type="number" className="h-9 w-24 text-right" value={taxPercent} onChange={(e) => setTaxPercent(Number(e.target.value))} />
            </div>
            <Row label={t("common.tax")} value={formatMoney(tax, currency, locale)} />
            <hr />
            <Row label={t("common.grandTotal")} value={formatMoney(total, currency, locale)} strong />
            <Row label={t("quotation.margin")} value={`${margin.toFixed(1)}%`} />
          </CardContent>
          <CardFooter className="justify-end flex-col gap-2">
            {err && <p className="text-rose-600 text-sm">{err}</p>}
            <Button size="lg" className="w-full" disabled={saving} onClick={save}>
              {saving ? t("common.loading") : t("common.save")}
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
      <span>{value}</span>
    </div>
  );
}
