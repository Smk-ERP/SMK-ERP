export type CurrencyCode = "LAK" | "THB" | "USD";

// Default rough rates, overridable via CurrencyRate table. THB base.
export const DEFAULT_RATES: Record<CurrencyCode, Record<CurrencyCode, number>> = {
  THB: { THB: 1, LAK: 620, USD: 0.028 },
  LAK: { THB: 1 / 620, LAK: 1, USD: 0.000045 },
  USD: { THB: 35.7, LAK: 22050, USD: 1 }
};

export function convert(amount: number, from: CurrencyCode, to: CurrencyCode, rates = DEFAULT_RATES) {
  if (from === to) return amount;
  const rate = rates[from]?.[to];
  if (!rate) throw new Error(`No rate ${from}->${to}`);
  return amount * rate;
}

/**
 * Deterministic money formatter.
 *
 * We DO NOT use `Intl.NumberFormat` here because:
 *   1. Node.js ships with "small-icu" by default — it only has full data for
 *      en-US. Locales like th-TH / lo-LA fall back to weird approximations
 *      ("฿175,00" with comma as decimal) that mismatch what Chrome/Edge
 *      produce on the same call ("฿175.00"). That triggers React hydration
 *      mismatch errors on every page that prints money.
 *   2. LAK currency support is inconsistent across Node minor versions.
 *
 * Output uses the ISO currency code (LAK / THB / USD) by default — symbols
 * like ₭ and ฿ are unsafe because many Lao fonts (Saysettha OT) don't
 * include them and render as tofu boxes. Pass style="symbol" for symbol mode.
 *
 *   LAK 1234567               → "LAK 1,234,567"
 *   THB 175                   → "THB 175.00"
 *   USD 42.5                  → "USD 42.50"
 *   LAK 1234567 symbol-mode   → "₭ 1,234,567"
 */
export function formatMoney(
  amount: number,
  currency: CurrencyCode,
  _locale = "en",
  style: "code" | "symbol" = "code"
) {
  if (!Number.isFinite(amount)) amount = 0;
  const decimals = currency === "LAK" ? 0 : 2;
  const fixed = Math.abs(amount).toFixed(decimals);
  const [intPart, decPart] = fixed.split(".");
  const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const num = decPart ? `${withSep}.${decPart}` : withSep;
  const sign = amount < 0 ? "−" : "";
  const prefix = style === "symbol"
    ? (currency === "LAK" ? "₭" : currency === "THB" ? "฿" : "$")
    : currency;
  return `${sign}${prefix} ${num}`;
}
