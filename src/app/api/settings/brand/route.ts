import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { invalidateBrandCache, parseSignatureConfig, stringifySignatureConfig, type SignatureConfig } from "@/lib/brand";
import { z } from "zod";

const Input = z.object({
  companyName: z.string().min(1).optional(),
  tagline: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  country: z.string().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  bankInfo: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  primaryColor: z.string().optional(),
  signatureConfig: z.record(z.array(z.object({
    label: z.string(), role: z.string().optional()
  }))).optional()
});

export async function GET() {
  const row = await prisma.brandSetting.findUnique({ where: { id: "singleton" } });
  return NextResponse.json({
    brand: row
      ? {
          ...row,
          signatureConfig: parseSignatureConfig(row.signatureConfig)
        }
      : null
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["OWNER", "ADMIN_MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = Input.parse(await req.json());
  const sigCsv = parsed.signatureConfig
    ? stringifySignatureConfig(parsed.signatureConfig as SignatureConfig)
    : undefined;

  const data: any = {};
  for (const [k, v] of Object.entries(parsed)) {
    if (k === "signatureConfig") continue;
    if (v !== undefined) data[k] = v;
  }
  if (sigCsv !== undefined) data.signatureConfig = sigCsv;
  data.updatedById = user.id;

  // Upsert
  const row = await prisma.brandSetting.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", companyName: parsed.companyName ?? "The Signmaker", ...data }
  });

  invalidateBrandCache();

  await prisma.auditLog.create({
    data: {
      userId: user.id, action: "settings.brand.update",
      entity: "BrandSetting", entityId: "singleton",
      after: JSON.stringify(data)
    }
  }).catch(() => {});

  return NextResponse.json({ brand: { ...row, signatureConfig: parseSignatureConfig(row.signatureConfig) } });
}
