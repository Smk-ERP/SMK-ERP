import type { UserRole } from "./enums";

// Phase 1 — coarse menu visibility per role. Action-level checks live in API routes.
export const MENU_PERMISSIONS: Record<UserRole, string[]> = {
  OWNER:               ["dashboard", "customers", "quotations", "calculator", "jobs", "production", "inventory", "qc", "installation", "finance", "kpi", "settings"],
  ADMIN_MANAGER:       ["dashboard", "customers", "quotations", "calculator", "jobs", "production", "inventory", "qc", "installation", "finance", "kpi", "settings"],
  SALES_MANAGER:       ["dashboard", "customers", "quotations", "calculator", "jobs", "kpi"],
  SALES_STAFF:         ["dashboard", "customers", "quotations", "calculator", "jobs"],
  PRODUCTION_MANAGER:  ["dashboard", "jobs", "production", "inventory", "qc", "installation"],
  DESIGNER:            ["dashboard", "jobs"],
  PRODUCTION_STAFF:    ["dashboard", "jobs", "production"],
  QC_STAFF:            ["dashboard", "jobs", "qc"],
  INSTALLER:           ["dashboard", "jobs", "installation"],
  FINANCE:             ["dashboard", "customers", "quotations", "finance"],
  STOCK:               ["dashboard", "inventory"],
  HR:                  ["dashboard", "kpi"]
};

export function canView(role: UserRole, menu: string): boolean {
  return MENU_PERMISSIONS[role]?.includes(menu) ?? false;
}

export function canApproveQuotation(role: UserRole): boolean {
  return ["OWNER", "ADMIN_MANAGER", "SALES_MANAGER"].includes(role);
}

export function canManageJob(role: UserRole): boolean {
  return ["OWNER", "ADMIN_MANAGER", "PRODUCTION_MANAGER", "SALES_MANAGER", "SALES_STAFF"].includes(role);
}
