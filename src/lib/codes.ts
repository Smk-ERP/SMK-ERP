import { prisma } from "./prisma";

// Atomic-ish sequence: count rows of the year, +1. Good enough for Phase 1
// (we accept rare collisions only if the seed runs concurrently). Replace
// with a `Sequence` table or pg sequence for higher load.

export async function nextCustomerCode(): Promise<string> {
  const n = await prisma.customer.count();
  return `CUS-${(n + 1).toString().padStart(6, "0")}`;
}

export async function nextQuotationCode(year = new Date().getFullYear()): Promise<string> {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  const n = await prisma.quotation.count({ where: { issueDate: { gte: start, lt: end } } });
  return `QUO-${year}-${(n + 1).toString().padStart(4, "0")}`;
}

export async function nextJobCode(year = new Date().getFullYear()): Promise<string> {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  const n = await prisma.job.count({ where: { createdAt: { gte: start, lt: end } } });
  return `JOB-${year}-${(n + 1).toString().padStart(4, "0")}`;
}

export async function nextMaterialRequestCode(year = new Date().getFullYear()) {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  const n = await prisma.materialRequest.count({ where: { createdAt: { gte: start, lt: end } } });
  return `MR-${year}-${(n + 1).toString().padStart(4, "0")}`;
}

const PREFIX_BY_DOCTYPE: Record<string, string> = {
  QUOTATION: "QUO",
  BILLING_NOTE: "BN",
  INVOICE: "INV",
  RECEIPT: "REC",
  PAYMENT_SLIP: "PS",
  MATERIAL_REQUEST: "MR",
  DELIVERY_NOTE: "DN",
  INSTALLATION_REPORT: "IR"
};

export async function nextPurchaseOrderCode(year = new Date().getFullYear()): Promise<string> {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  const n = await prisma.purchaseOrder.count({ where: { issueDate: { gte: start, lt: end } } });
  return `PO-${year}-${(n + 1).toString().padStart(4, "0")}`;
}

export async function nextFinanceDocCode(docType: string, year = new Date().getFullYear()) {
  const prefix = PREFIX_BY_DOCTYPE[docType] ?? "DOC";
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  const n = await prisma.financeDocument.count({
    where: { docType, issuedAt: { gte: start, lt: end } }
  });
  return `${prefix}-${year}-${(n + 1).toString().padStart(4, "0")}`;
}
