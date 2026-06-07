import { prisma } from "./prisma";

export interface BrandSnapshot {
  companyName: string;
  tagline: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  taxId: string | null;
  bankInfo: string | null;
  logoUrl: string | null;
  primaryColor: string;
  signatureConfig: SignatureConfig;
}

export interface SignatureSlot {
  label: string;     // "Prepared by" / "Customer" / etc.
  role?: string;     // optional role name to suggest signer
}
export type SignatureConfig = Record<string, SignatureSlot[]>; // docType -> slots

/** Parses BrandSetting.signatureConfig CSV string. */
export function parseSignatureConfig(csv: string): SignatureConfig {
  const out: SignatureConfig = {};
  if (!csv) return out;
  for (const part of csv.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const [docType, raw] = trimmed.split(":");
    if (!docType || !raw) continue;
    const [label, role] = raw.split("|");
    if (!out[docType]) out[docType] = [];
    out[docType].push({ label: label?.trim() ?? raw, role: role?.trim() || undefined });
  }
  return out;
}

export function stringifySignatureConfig(cfg: SignatureConfig): string {
  const out: string[] = [];
  for (const [docType, slots] of Object.entries(cfg)) {
    for (const s of slots) {
      const role = s.role ? `|${s.role}` : "";
      out.push(`${docType}:${s.label}${role}`);
    }
  }
  return out.join(",");
}

/** Default signature slots per doc type (used when BrandSetting has none). */
export const DEFAULT_SIGNATURES: SignatureConfig = {
  QUOTATION:           [{ label: "Prepared by", role: "SALES_STAFF" }, { label: "Customer" }],
  BILLING_NOTE:        [{ label: "Issued by", role: "SALES_STAFF" }, { label: "Customer" }],
  INVOICE:             [{ label: "Issued by", role: "FINANCE" }, { label: "Customer" }],
  RECEIPT:             [{ label: "Received by", role: "FINANCE" }, { label: "Customer" }],
  PAYMENT_SLIP:        [{ label: "Paid by" }, { label: "Received by", role: "FINANCE" }],
  MATERIAL_REQUEST:    [{ label: "Requested by", role: "PRODUCTION_STAFF" }, { label: "Approved by", role: "STOCK" }, { label: "Issued by", role: "STOCK" }],
  DELIVERY_NOTE:       [{ label: "Delivered by", role: "INSTALLER" }, { label: "Customer" }],
  INSTALLATION_REPORT: [{ label: "Installer", role: "INSTALLER" }, { label: "Customer" }]
};

let cached: BrandSnapshot | null = null;
let cachedAt = 0;
const CACHE_MS = 30 * 1000;

/** Load brand settings, cached for 30s. Falls back to spec defaults. */
export async function getBrand(): Promise<BrandSnapshot> {
  if (cached && Date.now() - cachedAt < CACHE_MS) return cached;

  const row = await prisma.brandSetting
    .findUnique({ where: { id: "singleton" } })
    .catch(() => null);

  const userSig = row?.signatureConfig ? parseSignatureConfig(row.signatureConfig) : {};
  const signatureConfig: SignatureConfig = { ...DEFAULT_SIGNATURES, ...userSig };

  const snap: BrandSnapshot = {
    companyName:  row?.companyName ?? "The Signmaker",
    tagline:      row?.tagline ?? "Signage & Print Production",
    address:      row?.address ?? "Vientiane",
    city:         row?.city ?? null,
    province:     row?.province ?? null,
    country:      row?.country ?? "Lao PDR",
    phone:        row?.phone ?? "+856 20 0000 0000",
    email:        row?.email ?? "hello@signmaker.la",
    website:      row?.website ?? null,
    taxId:        row?.taxId ?? null,
    bankInfo:     row?.bankInfo ?? null,
    logoUrl:      row?.logoUrl ?? null,
    primaryColor: row?.primaryColor ?? "#06B6D4",
    signatureConfig
  };
  cached = snap; cachedAt = Date.now();
  return snap;
}

export function invalidateBrandCache() {
  cached = null; cachedAt = 0;
}
