"use client";

import { useMemo, useState, useEffect } from "react";
import {
  calculate,
  getDefaultsForSignType,
  type CalcInput,
  type CalcResult,
  type SignTypeKey
} from "@/lib/cost-calculator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney, convert, type CurrencyCode } from "@/lib/currency";

const SIGN_TYPES: SignTypeKey[] = [
  "LIT_LETTER_FRONT","LIT_LETTER_BACK","LIT_LETTER_EDGE","LIGHTBOX","LIGHT_CABINET",
  "VINYL","STAINLESS_EMBOSSED","ZINC_PAINTED","PLASTWOOD_CUT","ACRYLIC_CUT",
  "ACRYLIC_EMBOSSED","PLASTWOOD_ACRYLIC","PLASTWOOD_3D","NEON_FLEX","PRINT_3D",
  "EVENT_BOOTH","STRUCTURE_FRAME","OTHER"
];

const MARKUP_PRESETS = [20, 30, 40, 45];

export function CalculatorForm({
  initial,
  onResult,
  onAddToQuotation,
  displayCurrency,
  showCurrencySelector = true
}: {
  initial?: Partial<CalcInput>;
  onResult?: (input: CalcInput, result: CalcResult) => void;
  onAddToQuotation?: (input: CalcInput, result: CalcResult) => void;
  displayCurrency?: CurrencyCode;        // when provided, parent controls currency
  showCurrencySelector?: boolean;        // hide selector when parent provides currency
}) {
  const { t, locale } = useI18n();

  const [input, setInput] = useState<CalcInput>({
    signType: "VINYL",
    widthMm: 1000,
    heightMm: 500,
    quantity: 1,
    pricingMode: "MARKUP",
    channel: "RETAIL",
    includeInstall: false,
    hasTax: false,
    taxPercent: 7,
    ...getDefaultsForSignType("VINYL"),
    ...initial
  });

  // Auto-fill defaults when sign type changes (preserves user-typed values otherwise)
  const [autoSignType, setAutoSignType] = useState(input.signType);
  useEffect(() => {
    if (input.signType !== autoSignType) {
      setInput((prev) => ({ ...prev, ...getDefaultsForSignType(prev.signType) }));
      setAutoSignType(input.signType);
    }
  }, [input.signType, autoSignType]);

  const result = useMemo(() => calculate(input), [input]);
  useEffect(() => onResult?.(input, result), [input, result, onResult]);

  const set = <K extends keyof CalcInput>(k: K) => (v: any) => {
    setInput((p) => ({ ...p, [k]: v === "" ? undefined : v }));
  };
  const setNum = (k: keyof CalcInput) => (e: any) => set(k)(e.target.value === "" ? undefined : Number(e.target.value));

  // Calculator works in THB internally — convert results to display currency.
  // Parent (e.g. quotation builder) can lock currency via displayCurrency prop;
  // standalone /calculator page lets user pick from local state.
  const [localCurrency, setLocalCurrency] = useState<CurrencyCode>("THB");
  const currency: CurrencyCode = displayCurrency ?? localCurrency;
  const $ = (v: number) => formatMoney(convert(v, "THB", currency), currency, locale);

  // FIXED price mode disables every cost input (#5)
  const isFixed = input.pricingMode === "FIXED";

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {/* Inputs */}
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>{t("calculator.title")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("calculator.signType")}</Label>
              <Select value={input.signType} onChange={(e) => set("signType")(e.target.value)}>
                {SIGN_TYPES.map((s) => <option key={s} value={s}>{t(`signTypes.${s}`)}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("calculator.quantity")}</Label>
              <Input type="number" min={1} value={input.quantity ?? 1} onChange={setNum("quantity")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("calculator.width")}</Label>
              <Input type="number" value={input.widthMm ?? ""} onChange={setNum("widthMm")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("calculator.height")}</Label>
              <Input type="number" value={input.heightMm ?? ""} onChange={setNum("heightMm")} />
            </div>
          </div>

          <div className={`border-t pt-4 grid sm:grid-cols-3 gap-3 ${isFixed ? "opacity-50" : ""}`}>
            <div className="space-y-1.5">
              <Label>{t("calculator.materialPerSqm")} (THB)</Label>
              <Input type="number" value={input.materialPerSqm ?? ""} onChange={setNum("materialPerSqm")} disabled={isFixed} />
            </div>
            <div className="space-y-1.5">
              <Label>Border / ຂອບເສັ້ນ (THB / m)</Label>
              <Input type="number" value={input.borderPerMeter ?? ""} onChange={setNum("borderPerMeter")} disabled={isFixed} placeholder="e.g. 180" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("calculator.ledModule")} (THB)</Label>
              <Input type="number" value={input.ledModulePerMeter ?? ""} onChange={setNum("ledModulePerMeter")} disabled={isFixed} />
            </div>
            <div className="space-y-1.5">
              <Label>LED density (m/m²)</Label>
              <Input type="number" value={input.ledModuleDensity ?? ""} onChange={setNum("ledModuleDensity")} disabled={isFixed} />
            </div>

            <div className="space-y-1.5">
              <Label>CNC (THB)</Label>
              <Input type="number" value={input.cncCost ?? ""} onChange={setNum("cncCost")} disabled={isFixed} />
            </div>
            <div className="space-y-1.5">
              <Label>CO₂ Laser (THB)</Label>
              <Input type="number" value={input.co2LaserCost ?? ""} onChange={setNum("co2LaserCost")} disabled={isFixed} />
            </div>
            <div className="space-y-1.5">
              <Label>Fiber Laser (THB)</Label>
              <Input type="number" value={input.fiberLaserCost ?? ""} onChange={setNum("fiberLaserCost")} disabled={isFixed} />
            </div>

            <div className="space-y-1.5">
              <Label>{t("calculator.labor")} (THB)</Label>
              <Input type="number" value={input.laborCost ?? ""} onChange={setNum("laborCost")} disabled={isFixed} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("calculator.design")} (THB)</Label>
              <Input type="number" value={input.designCost ?? ""} onChange={setNum("designCost")} disabled={isFixed} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("calculator.install")} (THB)</Label>
              <Input type="number" value={input.installCost ?? ""} onChange={setNum("installCost")} disabled={isFixed} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("calculator.transport")} (THB)</Label>
              <Input type="number" value={input.transportCost ?? ""} onChange={setNum("transportCost")} disabled={isFixed} />
            </div>
            <div className="space-y-1.5">
              <Label>Electricity (THB)</Label>
              <Input type="number" value={input.electricityCost ?? ""} onChange={setNum("electricityCost")} disabled={isFixed} />
            </div>
          </div>

          <div className={`border-t pt-4 grid sm:grid-cols-3 gap-3 ${isFixed ? "opacity-50" : ""}`}>
            <div className="space-y-1.5">
              <Label>{t("calculator.wastePercent")}</Label>
              <Input type="number" value={input.wastePercent ?? ""} onChange={setNum("wastePercent")} disabled={isFixed} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("calculator.overheadPercent")}</Label>
              <Input type="number" value={input.overheadPercent ?? ""} onChange={setNum("overheadPercent")} disabled={isFixed} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("calculator.profitPercent")}</Label>
              <Input type="number" value={input.profitPercent ?? ""} onChange={setNum("profitPercent")} disabled={isFixed} />
            </div>
          </div>

          <div className="border-t pt-4 grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Pricing mode</Label>
              <div className="flex gap-2 flex-wrap">
                {(["MARKUP","MARGIN","FIXED"] as const).map((m) => (
                  <Button
                    key={m}
                    type="button"
                    variant={input.pricingMode === m ? "default" : "outline"}
                    size="sm"
                    onClick={() => set("pricingMode")(m)}
                  >
                    {m === "MARKUP" ? t("calculator.useMarkup")
                      : m === "MARGIN" ? t("calculator.useMargin")
                      : "Fix Price / ລາຄາຄົງທີ່"}
                  </Button>
                ))}
              </div>
            </div>
            {isFixed && (
              <div className="space-y-1.5">
                <Label>Fixed Price / ລາຄາຄົງທີ່ (THB, ກ່ອນ VAT)</Label>
                <Input
                  type="number"
                  value={input.fixedPrice ?? ""}
                  onChange={setNum("fixedPrice")}
                  placeholder="e.g. 5000"
                  className="font-semibold text-cyan-700"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">ໃສ່ລາຄາສຸດທ້າຍໂດຍກົງ — ຄ່າຕົ້ນທຶນອື່ນທັງໝົດຈະບໍ່ມີຜົນ</p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Markup presets</Label>
              <div className="flex flex-wrap gap-2">
                {MARKUP_PRESETS.map((p) => (
                  <Button key={p} type="button" variant="outline" size="sm" onClick={() => set("profitPercent")(p)}>
                    {p}%
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Channel</Label>
              <div className="flex gap-2">
                {(["RETAIL","WHOLESALE"] as const).map((c) => (
                  <Button
                    key={c}
                    type="button"
                    variant={input.channel === c ? "default" : "outline"}
                    size="sm"
                    onClick={() => set("channel")(c)}
                  >
                    {c === "RETAIL" ? t("calculator.retail") : t("calculator.wholesale")}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Toggles</Label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant={input.includeInstall ? "default" : "outline"} onClick={() => set("includeInstall")(!input.includeInstall)}>
                  {t("calculator.includeInstall")}
                </Button>
                <Button type="button" size="sm" variant={input.hasTax ? "default" : "outline"} onClick={() => set("hasTax")(!input.hasTax)}>
                  {t("calculator.vat")}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      <Card className="lg:col-span-1 self-start sticky top-20">
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle>{t("calculator.totalCost")} / {t("calculator.sellingPrice")}</CardTitle>
          {showCurrencySelector && !displayCurrency && (
            <Select
              value={localCurrency}
              onChange={(e) => setLocalCurrency(e.target.value as CurrencyCode)}
              className="h-8 w-24 text-sm"
            >
              <option>THB</option><option>LAK</option><option>USD</option>
            </Select>
          )}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label={t("calculator.area")} value={`${result.areaSqm} m²  ×  ${input.quantity}`} />
          <hr />
          <Row label="Material" value={$(result.material)} />
          <Row label="Machine" value={$(result.machine)} />
          <Row label="Labor" value={$(result.labor)} />
          <Row label="Design" value={$(result.design)} />
          <Row label="Install" value={$(result.install)} />
          <Row label="Transport" value={$(result.transport)} />
          <Row label="Electricity" value={$(result.electricity)} />
          <Row label="Waste" value={$(result.waste)} />
          <Row label="Overhead" value={$(result.overhead)} />
          <hr />
          <Row label={t("calculator.totalCost")} value={$(result.costBeforeProfit)} strong />
          <Row label="Profit" value={$(result.profit)} />
          {input.hasTax && <Row label="VAT" value={$(result.tax)} />}
          <hr />
          <Row label={t("calculator.sellingPrice")} value={$(result.priceFinal)} strong tone="primary" />
          <Row label="Per unit" value={$(result.pricePerUnit)} />
          <Row label={t("calculator.marginActual")} value={`${result.marginActual}%`} tone="success" />

          {onAddToQuotation && (
            <Button className="w-full mt-3" size="lg" onClick={() => onAddToQuotation(input, result)}>
              {t("calculator.addToQuotation")}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: "primary" | "success" }) {
  const toneCls = tone === "primary" ? "text-cyan-700" : tone === "success" ? "text-emerald-700" : "";
  return (
    <div className={`flex justify-between ${strong ? "font-bold text-base " + toneCls : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
