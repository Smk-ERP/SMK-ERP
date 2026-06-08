// ────────────────────────────────────────────────────────────────────────────
// Cost Calculator — pure functions (no React, no DB)
// Used both by the UI page and by Quotation/QuotationItem.costBreakdown JSON.
// All money values here are in THB unless otherwise stated; conversion to
// the quotation's display currency happens at the quotation layer.
// ────────────────────────────────────────────────────────────────────────────

export type SignTypeKey =
  | "LIT_LETTER_FRONT"
  | "LIT_LETTER_BACK"
  | "LIT_LETTER_EDGE"
  | "LIGHTBOX"
  | "LIGHT_CABINET"
  | "VINYL"
  | "STAINLESS_EMBOSSED"
  | "ZINC_PAINTED"
  | "PLASTWOOD_CUT"
  | "ACRYLIC_CUT"
  | "ACRYLIC_EMBOSSED"
  | "PLASTWOOD_ACRYLIC"
  | "PLASTWOOD_3D"
  | "NEON_FLEX"
  | "PRINT_3D"
  | "EVENT_BOOTH"
  | "STRUCTURE_FRAME"
  | "OTHER";

export interface MaterialDefaults {
  vinylPerSqm: number;
  uvPrintPerSqm: number;
  acpAcorr3mmPerSqm: number;
  acpAcorr4mmPerSqm: number;
  acpAltec4mmPerSqm: number;
  steelPerKg: number;
  aluminumStructurePerSqm: number;
  filament3dPerKg: number;
  min3dPrintProfit: number;
}

export const MATERIAL_DEFAULTS: MaterialDefaults = {
  vinylPerSqm: 350,
  uvPrintPerSqm: 550,
  acpAcorr3mmPerSqm: 720,
  acpAcorr4mmPerSqm: 1150,
  acpAltec4mmPerSqm: 2150,
  steelPerKg: 25,
  aluminumStructurePerSqm: 650,
  filament3dPerKg: 220,
  min3dPrintProfit: 200
};

export interface CalcInput {
  signType: SignTypeKey;
  widthMm: number;          // size of sign
  heightMm: number;
  quantity: number;

  // Material costs (per relevant unit). Defaults filled by UI from MATERIAL_DEFAULTS.
  materialPerSqm?: number;        // primary face material cost / m²
  materialPerSheet?: number;      // optional - per sheet (1.22 × 2.44 m)
  materialPerMeter?: number;      // optional - linear (e.g. neon flex)
  borderPerMeter?: number;        // optional - sign edge/frame material per linear meter
  ledModulePerMeter?: number;     // e.g. 180 THB/m
  ledModuleDensity?: number;      // modules per m² (optional advanced)

  // Machine costs
  cncCost?: number;
  co2LaserCost?: number;
  fiberLaserCost?: number;

  // Other line costs (job-level, not per m²)
  electricityCost?: number;
  laborCost?: number;
  designCost?: number;
  installCost?: number;
  transportCost?: number;

  // Percentages
  wastePercent?: number;          // applied on material
  overheadPercent?: number;       // applied on subtotal
  profitPercent?: number;         // markup OR margin
  taxPercent?: number;            // VAT, applied after profit if enabled

  // Toggles
  includeInstall?: boolean;
  hasTax?: boolean;
  pricingMode?: "MARKUP" | "MARGIN" | "FIXED";   // FIXED: ignore all costs, use fixedPrice
  fixedPrice?: number;                            // total price (before VAT) when pricingMode=FIXED
  channel?: "RETAIL" | "WHOLESALE"; // wholesale = -10% from final
}

export interface CalcResult {
  areaSqm: number;
  unitsArea: number;          // area × qty for batch costs
  material: number;
  machine: number;
  labor: number;
  design: number;
  install: number;
  transport: number;
  electricity: number;
  waste: number;
  overhead: number;
  costBeforeProfit: number;
  profit: number;
  priceBeforeTax: number;
  tax: number;
  priceFinal: number;
  pricePerUnit: number;
  marginActual: number;       // %
}

export function calculate(input: CalcInput): CalcResult {
  const widthM = (input.widthMm || 0) / 1000;
  const heightM = (input.heightMm || 0) / 1000;
  const areaSqm = +(widthM * heightM).toFixed(4);
  const qty = Math.max(1, input.quantity || 1);
  const unitsArea = +(areaSqm * qty).toFixed(4);

  // Material: prefer per-m², else per-sheet (1 sheet ≈ 1.22 × 2.44 = 2.9768 m²), else per-meter
  let material = 0;
  if (input.materialPerSqm) {
    material += input.materialPerSqm * unitsArea;
  } else if (input.materialPerSheet) {
    const sheets = Math.ceil(unitsArea / 2.9768);
    material += input.materialPerSheet * sheets;
  } else if (input.materialPerMeter) {
    const meters = (widthM + heightM) * 2 * qty;
    material += input.materialPerMeter * meters;
  }

  // LED — used by lit letters / lightbox types
  if (input.ledModulePerMeter) {
    const ledLengthM = input.ledModuleDensity
      ? input.ledModuleDensity * unitsArea
      : (widthM + heightM) * 2 * qty;
    material += input.ledModulePerMeter * ledLengthM;
  }

  // Sign border/edge frame (e.g. aluminum trim, lightbox rim) — perimeter × cost/m
  if (input.borderPerMeter) {
    const perimeterM = (widthM + heightM) * 2 * qty;
    material += input.borderPerMeter * perimeterM;
  }

  const machine = (input.cncCost ?? 0) + (input.co2LaserCost ?? 0) + (input.fiberLaserCost ?? 0);
  const electricity = input.electricityCost ?? 0;
  const labor = input.laborCost ?? 0;
  const design = input.designCost ?? 0;
  const install = input.includeInstall ? (input.installCost ?? 0) : 0;
  const transport = input.transportCost ?? 0;

  const waste = material * ((input.wastePercent ?? 0) / 100);
  const beforeOverhead = material + machine + labor + design + install + transport + electricity + waste;
  const overhead = beforeOverhead * ((input.overheadPercent ?? 0) / 100);
  const costBeforeProfit = +(beforeOverhead + overhead).toFixed(2);

  const profitPct = input.profitPercent ?? 30;
  let priceBeforeTax: number;
  let profit: number;
  if (input.pricingMode === "FIXED") {
    // Fixed price — user enters final selling price directly (excl. VAT). Profit
    // is reverse-derived from cost basis so margin reporting still works.
    priceBeforeTax = +(input.fixedPrice ?? 0).toFixed(2);
    profit = +(priceBeforeTax - costBeforeProfit).toFixed(2);
  } else if (input.pricingMode === "MARGIN") {
    // Margin: price = cost / (1 - margin%)
    const m = Math.min(0.95, profitPct / 100);
    priceBeforeTax = +(costBeforeProfit / (1 - m)).toFixed(2);
    profit = +(priceBeforeTax - costBeforeProfit).toFixed(2);
  } else {
    // Markup: price = cost * (1 + markup%)
    profit = +(costBeforeProfit * (profitPct / 100)).toFixed(2);
    priceBeforeTax = +(costBeforeProfit + profit).toFixed(2);
  }

  // Wholesale = -10% off list price (configurable convention)
  if (input.channel === "WHOLESALE") {
    const adj = +(priceBeforeTax * 0.9).toFixed(2);
    profit = +(adj - costBeforeProfit).toFixed(2);
    priceBeforeTax = adj;
  }

  const tax = input.hasTax ? +(priceBeforeTax * ((input.taxPercent ?? 7) / 100)).toFixed(2) : 0;
  let priceFinal = +(priceBeforeTax + tax).toFixed(2);

  // 3D print minimum profit guard
  if (input.signType === "PRINT_3D" && profit < MATERIAL_DEFAULTS.min3dPrintProfit) {
    const lift = MATERIAL_DEFAULTS.min3dPrintProfit - profit;
    priceBeforeTax += lift;
    profit += lift;
    priceFinal = +(priceBeforeTax + (input.hasTax ? priceBeforeTax * ((input.taxPercent ?? 7) / 100) : 0)).toFixed(2);
  }

  const pricePerUnit = +(priceFinal / qty).toFixed(2);
  const marginActual = priceBeforeTax > 0
    ? +(((priceBeforeTax - costBeforeProfit) / priceBeforeTax) * 100).toFixed(2)
    : 0;

  return {
    areaSqm,
    unitsArea,
    material: +material.toFixed(2),
    machine: +machine.toFixed(2),
    labor: +labor.toFixed(2),
    design: +design.toFixed(2),
    install: +install.toFixed(2),
    transport: +transport.toFixed(2),
    electricity: +electricity.toFixed(2),
    waste: +waste.toFixed(2),
    overhead: +overhead.toFixed(2),
    costBeforeProfit,
    profit,
    priceBeforeTax,
    tax,
    priceFinal,
    pricePerUnit,
    marginActual
  };
}

// Sensible per-sign-type material defaults (fills the UI on signType change)
export function getDefaultsForSignType(t: SignTypeKey): Partial<CalcInput> {
  const m = MATERIAL_DEFAULTS;
  switch (t) {
    case "VINYL":
      return { materialPerSqm: m.vinylPerSqm, wastePercent: 8, overheadPercent: 10, profitPercent: 30 };
    case "LIGHTBOX":
    case "LIGHT_CABINET":
      return { materialPerSqm: m.acpAcorr4mmPerSqm, ledModulePerMeter: 180, ledModuleDensity: 6,
               overheadPercent: 12, wastePercent: 10, profitPercent: 35 };
    case "LIT_LETTER_FRONT":
    case "LIT_LETTER_BACK":
    case "LIT_LETTER_EDGE":
      return { materialPerSqm: m.acpAltec4mmPerSqm, ledModulePerMeter: 180, ledModuleDensity: 8,
               overheadPercent: 15, wastePercent: 12, profitPercent: 40 };
    case "STAINLESS_EMBOSSED":
      return { materialPerSqm: 2200, overheadPercent: 15, wastePercent: 8, profitPercent: 40 };
    case "ZINC_PAINTED":
      return { materialPerSqm: m.steelPerKg * 8, overheadPercent: 10, wastePercent: 10, profitPercent: 30 };
    case "PLASTWOOD_CUT":
      return { materialPerSqm: 950, co2LaserCost: 150, overheadPercent: 10, wastePercent: 8, profitPercent: 35 };
    case "ACRYLIC_CUT":
      return { materialPerSqm: 1400, co2LaserCost: 200, overheadPercent: 10, wastePercent: 8, profitPercent: 35 };
    case "ACRYLIC_EMBOSSED":
    case "PLASTWOOD_ACRYLIC":
      return { materialPerSqm: 1600, co2LaserCost: 250, overheadPercent: 12, wastePercent: 10, profitPercent: 40 };
    case "PLASTWOOD_3D":
      return { materialPerSqm: 1200, cncCost: 300, overheadPercent: 12, wastePercent: 10, profitPercent: 40 };
    case "NEON_FLEX":
      return { materialPerMeter: 320, overheadPercent: 10, wastePercent: 5, profitPercent: 40 };
    case "PRINT_3D":
      return { materialPerSqm: 0, laborCost: 150, overheadPercent: 15, wastePercent: 5, profitPercent: 45 };
    case "EVENT_BOOTH":
      return { materialPerSqm: 800, laborCost: 2000, transportCost: 1500, overheadPercent: 15, wastePercent: 8, profitPercent: 35 };
    case "STRUCTURE_FRAME":
      return { materialPerSqm: m.aluminumStructurePerSqm, laborCost: 1500, overheadPercent: 12, wastePercent: 8, profitPercent: 30 };
    default:
      return { materialPerSqm: m.uvPrintPerSqm, overheadPercent: 10, wastePercent: 8, profitPercent: 30 };
  }
}
