// Incentive / commission engine — pure functions.
//
// Convention from spec:
//   - Sales target tier starts at 600,000,000 LAK = 100% target achievement
//   - Tops out around 2,000,000,000 LAK
//   - Final commission = base × tierMultiplier × (totalScore / 100)
//   - totalScore = KPI(70%) + KBI(30%)

export const KPI_WEIGHT = 0.7;
export const KBI_WEIGHT = 0.3;

export interface CommissionTier {
  minSalesLak: number;   // inclusive
  pct: number;           // base commission % of sales for this tier
  multiplier: number;    // applied to base × (KPI+KBI)
  label: string;
}

// LAK-denominated tiers. Sales in other currencies must be converted first.
export const DEFAULT_TIERS: CommissionTier[] = [
  { minSalesLak: 2_000_000_000, pct: 1.50, multiplier: 1.5, label: "Diamond" },
  { minSalesLak: 1_500_000_000, pct: 1.20, multiplier: 1.3, label: "Platinum" },
  { minSalesLak: 1_000_000_000, pct: 1.00, multiplier: 1.15, label: "Gold" },
  { minSalesLak:   600_000_000, pct: 0.80, multiplier: 1.0,  label: "Silver (target)" },
  { minSalesLak:           0,    pct: 0,    multiplier: 0,    label: "Below target" }
];

export interface CommissionInput {
  salesLak: number;       // sales achieved in LAK
  kpiScore: number;       // 0–100
  kbiScore: number;       // 0–100
}

export interface CommissionResult {
  tier: CommissionTier;
  totalScore: number;     // weighted KPI+KBI
  achievementPct: number; // % of 600M target
  baseCommission: number; // tier.pct × sales
  finalCommission: number;// base × multiplier × (score/100)
}

export function computeCommission(input: CommissionInput, tiers: CommissionTier[] = DEFAULT_TIERS): CommissionResult {
  const totalScore = input.kpiScore * KPI_WEIGHT + input.kbiScore * KBI_WEIGHT;
  const tier = tiers.find((t) => input.salesLak >= t.minSalesLak) ?? tiers[tiers.length - 1];
  const baseCommission = input.salesLak * (tier.pct / 100);
  const finalCommission = baseCommission * tier.multiplier * (totalScore / 100);
  const achievementPct = +(input.salesLak / 600_000_000 * 100).toFixed(1);
  return {
    tier,
    totalScore: +totalScore.toFixed(2),
    achievementPct,
    baseCommission: +baseCommission.toFixed(2),
    finalCommission: +finalCommission.toFixed(2)
  };
}

export function periodLabel(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
