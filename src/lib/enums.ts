// String-literal "enums" — single source of truth used by both the app code
// and any documentation. The Prisma schema stores these as `String` columns
// because SQLite doesn't support native enums; on Postgres you can restore
// the real `enum` types (see prisma/schema.postgres.bak).

export const USER_ROLES = [
  "OWNER", "ADMIN_MANAGER", "SALES_MANAGER", "SALES_STAFF",
  "PRODUCTION_MANAGER", "DESIGNER", "PRODUCTION_STAFF", "QC_STAFF",
  "INSTALLER", "FINANCE", "STOCK", "HR"
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const CUSTOMER_TYPES = [
  "WALK_IN", "RETURNING", "FACEBOOK", "WHATSAPP",
  "TIKTOK", "REFERRAL", "CORPORATE", "OTHER"
] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

export const CURRENCIES = ["LAK", "THB", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const QUOTATION_STATUSES = [
  "DRAFT", "SENT", "APPROVED", "REJECTED", "CONVERTED", "EXPIRED"
] as const;
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export const JOB_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type JobPriority = (typeof JOB_PRIORITIES)[number];

export const PURCHASE_ORDER_STATUSES = ["DRAFT", "SENT", "PARTIAL", "RECEIVED", "CANCELLED"] as const;
export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number];

export const JOB_STATUSES = [
  "NEW", "CONFIRMED", "DESIGN", "WAITING_MATERIAL", "PRODUCTION",
  "QC", "REWORK", "READY_TO_INSTALL", "INSTALLING",
  "DELIVERED", "COMPLETED", "CANCELLED"
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const SIGN_TYPES = [
  "LIT_LETTER_FRONT", "LIT_LETTER_BACK", "LIT_LETTER_EDGE",
  "LIGHTBOX", "LIGHT_CABINET",
  "VINYL", "STAINLESS_EMBOSSED", "ZINC_PAINTED",
  "PLASTWOOD_CUT", "ACRYLIC_CUT", "ACRYLIC_EMBOSSED",
  "PLASTWOOD_ACRYLIC", "PLASTWOOD_3D", "NEON_FLEX",
  "PRINT_3D", "EVENT_BOOTH", "STRUCTURE_FRAME", "OTHER"
] as const;
export type SignType = (typeof SIGN_TYPES)[number];

export const UNIT_TYPES = [
  "MM", "CM", "M", "SQM", "SHEET", "ROLL", "KG", "PCS", "HOUR", "DAY"
] as const;
export type UnitType = (typeof UNIT_TYPES)[number];

export const INVENTORY_TXN_TYPES = ["RECEIVE", "ISSUE", "ADJUST", "RETURN"] as const;
export type InventoryTxnType = (typeof INVENTORY_TXN_TYPES)[number];

export const MATERIAL_REQUEST_STATUSES = ["REQUESTED", "APPROVED", "ISSUED", "REJECTED"] as const;
export type MaterialRequestStatus = (typeof MATERIAL_REQUEST_STATUSES)[number];

export const QC_RESULT_STATUSES = ["PASS", "FAIL"] as const;
export type QCResultStatus = (typeof QC_RESULT_STATUSES)[number];

export const INSTALLATION_STATUSES = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
export type InstallationStatus = (typeof INSTALLATION_STATUSES)[number];

export const FINANCE_DOC_TYPES = [
  "QUOTATION", "BILLING_NOTE", "INVOICE", "RECEIPT", "PAYMENT_SLIP",
  "MATERIAL_REQUEST", "DELIVERY_NOTE", "INSTALLATION_REPORT"
] as const;
export type FinanceDocType = (typeof FINANCE_DOC_TYPES)[number];

export const NOTIFICATION_TYPES = [
  "QUOTATION_APPROVED", "JOB_CONFIRMED", "MATERIAL_REQUESTED", "MATERIAL_APPROVED",
  "QC_FAILED", "JOB_READY_TO_INSTALL", "JOB_COMPLETED", "PAYMENT_RECEIVED", "GENERIC"
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
