import th from "../../../locales/th.json";
import lo from "../../../locales/lo.json";
import en from "../../../locales/en.json";

export const LOCALES = ["lo", "th", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = (process.env.DEFAULT_LANGUAGE as Locale) || "lo";

export const LOCALE_LABELS: Record<Locale, string> = {
  lo: "ລາວ (LA)",
  th: "ไทย (TH)",
  en: "English (EN)"
};

export const dictionaries = { th, lo, en } as const;
export type Dictionary = typeof en;

export function getDictionary(locale: Locale): Dictionary {
  return (dictionaries as any)[locale] ?? dictionaries.en;
}

// Dot-path getter: t("nav.dashboard")
export function tr(dict: any, key: string): string {
  const parts = key.split(".");
  let cur: any = dict;
  for (const p of parts) {
    if (cur == null) return key;
    cur = cur[p];
  }
  return typeof cur === "string" ? cur : key;
}
