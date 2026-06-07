import { PrismaClient } from "@prisma/client";
import type {
  UserRole, CustomerType, QuotationStatus, JobStatus,
  SignType, Currency, UnitType
} from "../src/lib/enums";
import { calculate, getDefaultsForSignType, type SignTypeKey } from "../src/lib/cost-calculator";
import { convert } from "../src/lib/currency";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding The Signmaker ERP…");

  // ─── Wipe (idempotent re-seed)
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.jobStatusHistory.deleteMany();
  await prisma.jobAttachment.deleteMany();
  await prisma.installation.deleteMany();
  await prisma.reworkTask.deleteMany();
  await prisma.qCResult.deleteMany();
  await prisma.qCChecklist.deleteMany();
  await prisma.materialRequestItem.deleteMany();
  await prisma.materialRequest.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.material.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.financeDocument.deleteMany();
  await prisma.job.deleteMany();
  await prisma.quotationItem.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.customerContact.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.kPIRecord.deleteMany();
  await prisma.incentivePlan.deleteMany();
  await prisma.user.deleteMany();
  await prisma.permission.deleteMany();

  // ─── Users (one per role)
  const userSeeds: { email: string; fullName: string; role: UserRole; language: string }[] = [
    { email: "owner@signmaker.la",          fullName: "Somsak Vongphachanh",     role: "OWNER",              language: "lo" },
    { email: "admin@signmaker.la",          fullName: "Vilasack Sayyalath",      role: "ADMIN_MANAGER",      language: "lo" },
    { email: "salesmgr@signmaker.la",       fullName: "Bouasone Phetmany",       role: "SALES_MANAGER",      language: "lo" },
    { email: "sales1@signmaker.la",         fullName: "Khamla Sengdara",         role: "SALES_STAFF",        language: "lo" },
    { email: "prodmgr@signmaker.la",        fullName: "Tongkham Vorachit",       role: "PRODUCTION_MANAGER", language: "lo" },
    { email: "designer@signmaker.la",       fullName: "Mali Phommavong",         role: "DESIGNER",           language: "lo" },
    { email: "prod1@signmaker.la",          fullName: "Bounthavy Soulivong",     role: "PRODUCTION_STAFF",   language: "lo" },
    { email: "qc@signmaker.la",             fullName: "Phonexay Inthavong",      role: "QC_STAFF",           language: "lo" },
    { email: "installer@signmaker.la",      fullName: "Khamphone Vannasy",       role: "INSTALLER",          language: "lo" },
    { email: "finance@signmaker.la",        fullName: "Latda Sengsoulin",        role: "FINANCE",            language: "lo" },
    { email: "stock@signmaker.la",          fullName: "Souksavanh Phanthamaly",  role: "STOCK",              language: "lo" },
    { email: "hr@signmaker.la",             fullName: "Noy Phimmasone",          role: "HR",                 language: "lo" }
  ];

  const users = await Promise.all(
    userSeeds.map((u) =>
      prisma.user.create({
        data: { ...u, active: true }
      })
    )
  );
  const userByRole: Record<UserRole, typeof users[number]> = users.reduce((acc, u) => {
    (acc as any)[u.role] = u; return acc;
  }, {} as any);
  console.log(`✓ Users: ${users.length}`);

  // ─── Customers
  const customerSeeds = [
    { name: "ร้านกาแฟ Saffron",       type: "RETURNING" as CustomerType,  companyName: "Saffron Coffee Co.",          phone: "+85620 5555 0001", whatsapp: "+85620 5555 0001", province: "Vientiane" },
    { name: "Vientiane Mall",         type: "CORPORATE" as CustomerType,  companyName: "Vientiane Mall Co., Ltd.",    phone: "+85621 222 333",   email: "ops@vtmall.la",        province: "Vientiane" },
    { name: "ลุงสมศักดิ์",            type: "WALK_IN" as CustomerType,    companyName: null,                          phone: "+85620 9999 1234", province: "Vientiane" },
    { name: "Bouasavanh Beauty",      type: "FACEBOOK" as CustomerType,   companyName: "Bouasavanh Cosmetic",         phone: "+85620 7777 8888", facebook: "fb.com/bouasavanh", province: "Savannakhet" },
    { name: "Phongsavanh Group",      type: "REFERRAL" as CustomerType,   companyName: "Phongsavanh Holdings",        phone: "+85621 414 141",   email: "marketing@phongsavanh.la", province: "Vientiane" }
  ];
  const customers = await Promise.all(
    customerSeeds.map((c, i) =>
      prisma.customer.create({
        data: {
          code: `CUS-${(i + 1).toString().padStart(6, "0")}`,
          name: c.name, type: c.type, companyName: c.companyName,
          phone: c.phone, email: (c as any).email ?? null,
          whatsapp: (c as any).whatsapp ?? null, facebook: (c as any).facebook ?? null,
          province: c.province, country: "LA",
          isReturning: c.type === "RETURNING"
        }
      })
    )
  );
  console.log(`✓ Customers: ${customers.length}`);

  // ─── Helper to build a calculated line item
  function buildItem(signType: SignTypeKey, opts: { widthMm: number; heightMm: number; quantity: number; targetCurrency: Currency }) {
    const defaults = getDefaultsForSignType(signType);
    const input = { signType, ...opts, ...defaults } as any;
    const result = calculate(input);
    const unitPriceCurrency = convert(result.pricePerUnit, "THB", opts.targetCurrency);
    const unitCostCurrency = convert(result.costBeforeProfit / Math.max(1, opts.quantity), "THB", opts.targetCurrency);
    return {
      signType: signType as SignType,
      title: `${signType.replace(/_/g, " ")} ${opts.widthMm}×${opts.heightMm}`,
      description: `${opts.widthMm}×${opts.heightMm} mm`,
      widthMm: opts.widthMm,
      heightMm: opts.heightMm,
      areaSqm: result.areaSqm,
      quantity: opts.quantity,
      unit: "PCS" as UnitType,
      unitCost: +unitCostCurrency.toFixed(2),
      unitPrice: +unitPriceCurrency.toFixed(2),
      lineTotal: +(unitPriceCurrency * opts.quantity).toFixed(2),
      markupPercent: (input.profitPercent as number) ?? 30,
      costBreakdown: JSON.stringify({ input, result })
    };
  }

  // ─── Quotations — 5 examples spanning statuses
  type QSeed = {
    customer: number; currency: Currency; language: string; status: QuotationStatus;
    items: { st: SignTypeKey; w: number; h: number; q: number }[];
    discountPercent?: number; taxPercent?: number;
  };
  const qSeeds: QSeed[] = [
    { customer: 0, currency: "LAK", language: "lo", status: "DRAFT",
      items: [{ st: "VINYL", w: 2000, h: 1000, q: 1 }] },
    { customer: 1, currency: "LAK", language: "lo", status: "SENT",
      items: [
        { st: "LIGHTBOX", w: 3000, h: 1500, q: 2 },
        { st: "ACRYLIC_CUT", w: 600, h: 200, q: 6 }
      ], discountPercent: 5 },
    { customer: 2, currency: "THB", language: "th", status: "APPROVED",
      items: [{ st: "VINYL", w: 1200, h: 800, q: 1 }, { st: "PLASTWOOD_3D", w: 600, h: 400, q: 1 }] },
    { customer: 3, currency: "LAK", language: "lo", status: "APPROVED",
      items: [{ st: "LIT_LETTER_FRONT", w: 4000, h: 600, q: 1 }] },
    { customer: 4, currency: "USD", language: "en", status: "CONVERTED",
      items: [{ st: "STAINLESS_EMBOSSED", w: 900, h: 300, q: 1 }, { st: "ACRYLIC_EMBOSSED", w: 700, h: 250, q: 2 }], taxPercent: 7 }
  ];

  const quotations: any[] = [];
  for (let i = 0; i < qSeeds.length; i++) {
    const s = qSeeds[i];
    const items = s.items.map((it) =>
      buildItem(it.st, { widthMm: it.w, heightMm: it.h, quantity: it.q, targetCurrency: s.currency })
    );
    const subtotal = items.reduce((sum, it) => sum + it.lineTotal, 0);
    const discount = subtotal * ((s.discountPercent ?? 0) / 100);
    const taxable = Math.max(0, subtotal - discount);
    const tax = taxable * ((s.taxPercent ?? 0) / 100);
    const total = taxable + tax;
    const costTotal = items.reduce((sum, it) => sum + it.unitCost * Number(it.quantity), 0);
    const margin = total > 0 ? ((total - costTotal) / total) * 100 : 0;

    const q = await prisma.quotation.create({
      data: {
        code: `QUO-${new Date().getFullYear()}-${(i + 1).toString().padStart(4, "0")}`,
        customerId: customers[s.customer].id,
        createdById: userByRole.SALES_STAFF.id,
        status: s.status,
        currency: s.currency,
        language: s.language,
        validUntil: new Date(Date.now() + 14 * 86400000),
        subtotal, discountAmount: 0, discountPercent: s.discountPercent ?? 0,
        taxPercent: s.taxPercent ?? 0, taxAmount: tax, total, marginActual: margin,
        approvedAt: s.status === "APPROVED" || s.status === "CONVERTED" ? new Date() : null,
        note: s.language === "lo" ? "ຂອບໃຈສຳລັບການເຊື່ອໝັ້ນ" : s.language === "th" ? "ขอบคุณที่ให้ความไว้วางใจ" : "Thank you for your business",
        termsText: s.language === "lo" ? "ຊຳລະ 50% ກ່ອນເລີ່ມຜະລິດ ແລະ 50% ກ່ອນຕິດຕັ້ງ" : "50% deposit before production, 50% before installation",
        items: { create: items as any }
      }
    });
    quotations.push(q);
  }
  console.log(`✓ Quotations: ${quotations.length}`);

  // ─── Jobs — cover all statuses
  const allJobStatuses: JobStatus[] = [
    "NEW", "CONFIRMED", "DESIGN", "WAITING_MATERIAL", "PRODUCTION",
    "QC", "REWORK", "READY_TO_INSTALL", "INSTALLING",
    "DELIVERED", "COMPLETED", "CANCELLED"
  ];

  // First job: linked to the CONVERTED quotation
  const convertedQ = quotations[4];
  const linkedJob = await prisma.job.create({
    data: {
      code: `JOB-${new Date().getFullYear()}-0001`,
      quotationId: convertedQ.id,
      customerId: convertedQ.customerId,
      status: "PRODUCTION",
      priority: "HIGH",
      assignedToId: userByRole.PRODUCTION_STAFF.id,
      team: "Production A",
      dueDate: new Date(Date.now() + 7 * 86400000),
      productionNote: "Stainless steel polish + acrylic backplate",
      statusHistory: {
        create: [
          { toStatus: "NEW", changedById: userByRole.SALES_STAFF.id, note: "Created from quotation" },
          { fromStatus: "NEW", toStatus: "CONFIRMED", changedById: userByRole.SALES_MANAGER.id },
          { fromStatus: "CONFIRMED", toStatus: "DESIGN", changedById: userByRole.DESIGNER.id, note: "Designing letters" },
          { fromStatus: "DESIGN", toStatus: "PRODUCTION", changedById: userByRole.PRODUCTION_MANAGER.id }
        ]
      }
    }
  });

  // Cover the rest of the statuses with synthetic jobs
  const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
  const otherJobs: any[] = [];
  for (let i = 0; i < allJobStatuses.length; i++) {
    if (allJobStatuses[i] === "PRODUCTION") continue;
    const cust = customers[i % customers.length];
    otherJobs.push(
      await prisma.job.create({
        data: {
          code: `JOB-${new Date().getFullYear()}-${(i + 2).toString().padStart(4, "0")}`,
          customerId: cust.id,
          status: allJobStatuses[i],
          priority: priorities[i % priorities.length],
          team: ["Production A", "Production B", "Install Team 1"][i % 3],
          dueDate: new Date(Date.now() + (i - 3) * 86400000),
          assignedToId: userByRole.PRODUCTION_STAFF.id,
          statusHistory: {
            create: { toStatus: allJobStatuses[i], changedById: userByRole.PRODUCTION_MANAGER.id, note: "Seeded for demo" }
          }
        }
      })
    );
  }
  console.log(`✓ Jobs: ${1 + otherJobs.length}`);

  // ─── Materials (sample inventory rows so Phase 2 has data)
  const materials = [
    { code: "MAT-VINYL-350", name: "Vinyl 3M Series IJ180",            category: "Vinyl",    unit: "SQM" as UnitType,   unitCost: 350,  stockQty: 120 },
    { code: "MAT-UV-550",    name: "UV Print substrate",                category: "Print",    unit: "SQM" as UnitType,   unitCost: 550,  stockQty: 80 },
    { code: "MAT-ACP-3MM",   name: "Acorress ACP 3mm",                  category: "ACP",      unit: "SHEET" as UnitType, unitCost: 2147, stockQty: 25 },
    { code: "MAT-ACP-4MM",   name: "Acorress ACP 4mm",                  category: "ACP",      unit: "SHEET" as UnitType, unitCost: 3424, stockQty: 18 },
    { code: "MAT-ALTEC-4",   name: "Altec ACP 4mm Premium",             category: "ACP",      unit: "SHEET" as UnitType, unitCost: 6400, stockQty: 8 },
    { code: "MAT-STEEL",     name: "Steel sheet 1.2mm",                 category: "Metal",    unit: "KG" as UnitType,    unitCost: 25,   stockQty: 500 },
    { code: "MAT-ALU",       name: "Aluminum structure",                category: "Metal",    unit: "SQM" as UnitType,   unitCost: 650,  stockQty: 60 },
    { code: "MAT-PLA",       name: "3D Filament PLA 1kg",               category: "3D",       unit: "KG" as UnitType,    unitCost: 220,  stockQty: 22 },
    { code: "MAT-LED-MOD",   name: "LED Module SMD 2835",               category: "LED",      unit: "M" as UnitType,     unitCost: 180,  stockQty: 200 },
    { code: "MAT-ACR-3MM",   name: "Acrylic 3mm clear",                 category: "Acrylic",  unit: "SHEET" as UnitType, unitCost: 1800, stockQty: 15 }
  ];
  const matRows = [];
  for (const m of materials) {
    matRows.push(await prisma.material.create({ data: { ...m, currency: "THB", reorderLevel: 5 } }));
  }
  console.log(`✓ Materials: ${materials.length}`);

  // ─── Sample inventory transactions (receive + issue history)
  for (const m of matRows.slice(0, 5)) {
    await prisma.inventoryTransaction.create({
      data: {
        materialId: m.id, type: "RECEIVE", quantity: 50, unit: m.unit,
        unitCost: Number(m.unitCost), note: "Initial stock"
      }
    });
  }
  console.log(`✓ Inventory transactions: 5`);

  // ─── Sample Material Request (against the production-stage job, in REQUESTED state)
  const productionJob = linkedJob;
  const mr = await prisma.materialRequest.create({
    data: {
      code: `MR-${new Date().getFullYear()}-0001`,
      jobId: productionJob.id,
      requestedById: userByRole.PRODUCTION_STAFF.id,
      status: "REQUESTED",
      note: "Materials for stainless letter run",
      items: {
        create: [
          { materialId: matRows[0].id, quantity: 2, unit: matRows[0].unit }, // Vinyl
          { materialId: matRows[8].id, quantity: 12, unit: matRows[8].unit } // LED Module
        ]
      }
    }
  });
  console.log(`✓ Material requests: 1 (${mr.code})`);

  // ─── Sample QC checklist (passed) on a job currently READY_TO_INSTALL
  const readyJob = otherJobs.find((j) => j.status === "READY_TO_INSTALL");
  if (readyJob) {
    const checklist = await prisma.qCChecklist.create({
      data: {
        jobId: readyJob.id,
        items: JSON.stringify([
          { key: "appearance", label: "Appearance", pass: true },
          { key: "size",       label: "Size",       pass: true },
          { key: "color",      label: "Color",      pass: true },
          { key: "led",        label: "LED",        pass: true },
          { key: "finish",     label: "Finish",     pass: true }
        ])
      }
    });
    await prisma.qCResult.create({
      data: {
        checklistId: checklist.id,
        status: "PASS",
        inspectedById: userByRole.QC_STAFF.id,
        note: "All checks passed"
      }
    });
    console.log(`✓ QC checks: 1 (PASS on ${readyJob.code})`);
  }

  // ─── Sample QC FAIL → Rework on a job currently REWORK
  const reworkJob = otherJobs.find((j) => j.status === "REWORK");
  if (reworkJob) {
    const checklist = await prisma.qCChecklist.create({
      data: {
        jobId: reworkJob.id,
        items: JSON.stringify([
          { key: "appearance", label: "Appearance", pass: true },
          { key: "size",       label: "Size",       pass: false, note: "0.5cm too narrow on left" },
          { key: "color",      label: "Color",      pass: true },
          { key: "led",        label: "LED",        pass: false, note: "1 module dim" },
          { key: "finish",     label: "Finish",     pass: true }
        ])
      }
    });
    const result = await prisma.qCResult.create({
      data: {
        checklistId: checklist.id,
        status: "FAIL",
        inspectedById: userByRole.QC_STAFF.id,
        note: "2 items failed"
      }
    });
    await prisma.reworkTask.create({
      data: {
        qcResultId: result.id,
        description: "Size: 0.5cm too narrow on left; LED: 1 module dim"
      }
    });
    console.log(`✓ QC FAIL + Rework: 1 (on ${reworkJob.code})`);
  }

  // ─── Sample installations
  const installingJob = otherJobs.find((j) => j.status === "INSTALLING");
  const readyForInstall = otherJobs.find((j) => j.status === "READY_TO_INSTALL");
  if (installingJob) {
    await prisma.installation.create({
      data: {
        jobId: installingJob.id,
        ownerId: userByRole.INSTALLER.id,
        status: "IN_PROGRESS",
        scheduledAt: new Date(Date.now() - 86400000),
        note: "Team arrived on site"
      }
    });
  }
  if (readyForInstall) {
    await prisma.installation.create({
      data: {
        jobId: readyForInstall.id,
        ownerId: userByRole.INSTALLER.id,
        status: "SCHEDULED",
        scheduledAt: new Date(Date.now() + 3 * 86400000),
        note: "Customer requested morning slot"
      }
    });
  }
  console.log(`✓ Installations seeded`);

  // ─── Phase 3: Finance Documents + Payments
  const convertedQuote = quotations[4];
  // Invoice (partially paid)
  const inv = await prisma.financeDocument.create({
    data: {
      code: `INV-${new Date().getFullYear()}-0001`,
      docType: "INVOICE",
      jobId: linkedJob.id,
      customerId: convertedQuote.customerId,
      currency: convertedQuote.currency,
      language: "lo",
      amount: Number(convertedQuote.total),
      taxAmount: 0,
      total: Number(convertedQuote.total),
      payload: JSON.stringify({
        quotationCode: convertedQuote.code,
        taxPercent: 0,
        items: []
      }),
      createdById: userByRole.FINANCE.id
    }
  });
  await prisma.payment.create({
    data: {
      financeDocId: inv.id,
      amount: Number(convertedQuote.total) * 0.5,
      currency: convertedQuote.currency,
      method: "BANK_TRANSFER",
      reference: "TXN-INITIAL-DEPOSIT-001"
    }
  });
  // Receipt (fully paid)
  const completedJob = otherJobs.find((j) => j.status === "COMPLETED" || j.status === "DELIVERED");
  if (completedJob) {
    const rec = await prisma.financeDocument.create({
      data: {
        code: `REC-${new Date().getFullYear()}-0001`,
        docType: "RECEIPT",
        jobId: completedJob.id,
        customerId: completedJob.customerId,
        currency: "LAK",
        language: "lo",
        amount: 12_500_000,
        taxAmount: 0,
        total: 12_500_000,
        paidAt: new Date(),
        payload: JSON.stringify({ taxPercent: 0, items: [], note: "Full payment received" }),
        createdById: userByRole.FINANCE.id
      }
    });
    await prisma.payment.create({
      data: {
        financeDocId: rec.id,
        amount: 12_500_000,
        currency: "LAK",
        method: "CASH",
        reference: "CASH-0042"
      }
    });
  }
  // Billing note (unpaid)
  await prisma.financeDocument.create({
    data: {
      code: `BN-${new Date().getFullYear()}-0001`,
      docType: "BILLING_NOTE",
      jobId: linkedJob.id,
      customerId: convertedQuote.customerId,
      currency: "LAK",
      language: "lo",
      amount: 4_500_000,
      taxAmount: 0,
      total: 4_500_000,
      payload: JSON.stringify({ taxPercent: 0, items: [], note: "Installation balance" }),
      createdById: userByRole.SALES_STAFF.id
    }
  });
  console.log(`✓ Finance docs: 3 (Invoice, Receipt, Billing Note)`);

  // ─── Phase 3: KPI records for current period (sample for sales team)
  const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const kpiSeeds = [
    { user: userByRole.SALES_MANAGER, sales: 1_800_000_000, kpi: 92, kbi: 85 },
    { user: userByRole.SALES_STAFF,    sales: 850_000_000,   kpi: 78, kbi: 82 },
    { user: userByRole.DESIGNER,       sales: 0,             kpi: 88, kbi: 90 },
    { user: userByRole.PRODUCTION_MANAGER, sales: 0,         kpi: 86, kbi: 80 }
  ];
  for (const k of kpiSeeds) {
    const totalScore = k.kpi * 0.7 + k.kbi * 0.3;
    // Find tier
    const tiers = [
      { min: 2_000_000_000, pct: 1.5,  mul: 1.5 },
      { min: 1_500_000_000, pct: 1.2,  mul: 1.3 },
      { min: 1_000_000_000, pct: 1.0,  mul: 1.15 },
      { min:   600_000_000, pct: 0.8,  mul: 1.0 },
      { min:           0,    pct: 0,    mul: 0 }
    ];
    const tier = tiers.find((t) => k.sales >= t.min)!;
    const commission = k.sales * (tier.pct / 100) * tier.mul * (totalScore / 100);
    await prisma.kPIRecord.create({
      data: {
        userId: k.user.id, period,
        kpiScore: k.kpi, kbiScore: k.kbi, totalScore,
        salesAmount: k.sales || null, commission: commission || null
      }
    });
  }
  console.log(`✓ KPI records: ${kpiSeeds.length} for ${period}`);

  // ─── Phase 3: Notifications (one per role for demo)
  const notifSeeds = [
    { userId: userByRole.SALES_STAFF.id,        type: "QUOTATION_APPROVED",  title: `Quotation ${convertedQuote.code} approved`, link: `/quotations/${convertedQuote.id}` },
    { userId: userByRole.PRODUCTION_MANAGER.id, type: "JOB_CONFIRMED",       title: `New job ${linkedJob.code}`, link: `/jobs/${linkedJob.id}`, read: false },
    { userId: userByRole.STOCK.id,              type: "MATERIAL_REQUESTED",  title: `MR-${new Date().getFullYear()}-0001 awaiting approval`, link: "/material-requests" },
    { userId: userByRole.PRODUCTION_MANAGER.id, type: "QC_FAILED",           title: `QC FAIL on a job`, body: "2 items failed inspection", link: "/qc", read: true },
    { userId: userByRole.FINANCE.id,            type: "PAYMENT_RECEIVED",    title: `Payment received: INV-${new Date().getFullYear()}-0001`, body: "50% deposit", link: `/finance/${inv.id}` },
    { userId: userByRole.OWNER.id,              type: "GENERIC",             title: "Welcome to The Signmaker ERP", body: "Phase 3 modules enabled" }
  ];
  await prisma.notification.createMany({
    data: notifSeeds.map((n) => ({
      userId: n.userId, type: n.type, title: n.title,
      body: (n as any).body ?? null, link: n.link ?? null,
      read: (n as any).read ?? false
    }))
  });
  console.log(`✓ Notifications: ${notifSeeds.length}`);

  // ─── Sample audit log
  await prisma.auditLog.create({
    data: {
      userId: userByRole.OWNER.id,
      action: "seed.run",
      entity: "System",
      after: JSON.stringify({ at: new Date().toISOString(), users: users.length, phase: 3 })
    }
  });

  console.log("\n✅ Seed complete.");
  console.log("\nDemo logins (Supabase auth — create same emails or use demo mode):");
  for (const u of userSeeds.slice(0, 4)) console.log(`  • ${u.email}  (${u.role})`);
  console.log("  …  Password (after creating Supabase users): demo1234");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
