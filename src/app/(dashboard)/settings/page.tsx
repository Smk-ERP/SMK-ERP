import { prisma } from "@/lib/prisma";
import { parseSignatureConfig, DEFAULT_SIGNATURES } from "@/lib/brand";
import { SettingsView } from "./view.client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const row = await prisma.brandSetting.findUnique({ where: { id: "singleton" } });
  const brand = row
    ? {
        companyName: row.companyName,
        tagline: row.tagline ?? "",
        address: row.address ?? "",
        city: row.city ?? "",
        province: row.province ?? "",
        country: row.country,
        phone: row.phone ?? "",
        email: row.email ?? "",
        website: row.website ?? "",
        taxId: row.taxId ?? "",
        bankInfo: row.bankInfo ?? "",
        logoUrl: row.logoUrl,
        primaryColor: row.primaryColor,
        signatureConfig: parseSignatureConfig(row.signatureConfig)
      }
    : {
        companyName: "The Signmaker",
        tagline: "Signage & Print Production",
        address: "Vientiane",
        city: "",
        province: "",
        country: "Lao PDR",
        phone: "+856 20 0000 0000",
        email: "hello@signmaker.la",
        website: "",
        taxId: "",
        bankInfo: "",
        logoUrl: null,
        primaryColor: "#06B6D4",
        signatureConfig: DEFAULT_SIGNATURES
      };

  return <SettingsView initial={brand} />;
}
