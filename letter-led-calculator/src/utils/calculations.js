export const WASTE_PRESETS = [
  { label: 'Easy (5%)', value: 5 },
  { label: 'Medium (10%)', value: 10 },
  { label: 'Hard (15%)', value: 15 },
  { label: 'Custom', value: 'custom' },
];

export const OVERHEAD_PRESETS = [
  { label: '10%', value: 10 },
  { label: '11%', value: 11 },
  { label: '12%', value: 12 },
  { label: '13%', value: 13 },
  { label: '14%', value: 14 },
  { label: '15%', value: 15 },
  { label: 'Custom', value: 'custom' },
];

export const PROFIT_PRESETS = [
  { label: '30%', value: 30 },
  { label: '35%', value: 35 },
  { label: '40%', value: 40 },
  { label: '45%', value: 45 },
  { label: 'Custom', value: 'custom' },
];

export const num = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
};

export const formatTHB = (value) => {
  const n = Number(value) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
};

export const formatPercent = (value) => {
  const n = Number(value) || 0;
  return `${n.toFixed(2)}%`;
};

export function computeTotals({
  materialCost = 0,
  ledCost = 0,
  powerSupplyCost = 0,
  machineCost = 0,
  laborCost = 0,
  transportCost = 0,
  wastePercent = 0,
  overheadPercent = 0,
  profitPercent = 0,
}) {
  const subtotal =
    num(materialCost) +
    num(ledCost) +
    num(powerSupplyCost) +
    num(machineCost) +
    num(laborCost) +
    num(transportCost);

  const wasteCost = (subtotal * num(wastePercent)) / 100;
  const overheadCost = (subtotal * num(overheadPercent)) / 100;
  const totalCost = subtotal + wasteCost + overheadCost;

  const profit = Math.min(num(profitPercent), 99.99);
  const sellingPrice = totalCost / (1 - profit / 100);
  const grossProfit = sellingPrice - totalCost;
  const profitMargin = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0;

  return {
    materialCost: num(materialCost),
    ledCost: num(ledCost),
    powerSupplyCost: num(powerSupplyCost),
    machineCost: num(machineCost),
    laborCost: num(laborCost),
    transportCost: num(transportCost),
    subtotal,
    wasteCost,
    overheadCost,
    totalCost,
    sellingPrice,
    grossProfit,
    profitMargin,
  };
}
