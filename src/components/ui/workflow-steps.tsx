"use client";

import { Check } from "lucide-react";

export interface WorkflowStep {
  key: string;
  label: string;
}

/**
 * Horizontal stepper for document/job lifecycle visualization.
 *
 * Usage:
 *   <WorkflowSteps
 *     steps={QUOTATION_STEPS}
 *     currentKey="QUOTATION"   // highlights this step + marks earlier as done
 *   />
 *
 * - Steps before `currentKey` render as completed (green check + filled bar).
 * - The current step renders in brand cyan.
 * - Steps after render muted (gray).
 */
export function WorkflowSteps({
  steps,
  currentKey,
  className = ""
}: {
  steps: WorkflowStep[];
  currentKey: string;
  className?: string;
}) {
  const currentIdx = Math.max(0, steps.findIndex((s) => s.key === currentKey));

  return (
    <div className={`flex items-center w-full overflow-x-auto py-3 ${className}`}>
      {steps.map((step, i) => {
        const done    = i < currentIdx;
        const current = i === currentIdx;
        const upcoming = i > currentIdx;

        const circleCls = done
          ? "bg-emerald-500 text-white border-emerald-500"
          : current
          ? "bg-cyan-500 text-white border-cyan-500 ring-4 ring-cyan-100"
          : "bg-white text-slate-400 border-slate-300";

        const labelCls = done
          ? "text-emerald-700"
          : current
          ? "text-cyan-700 font-semibold"
          : "text-slate-400";

        const barCls = done ? "bg-emerald-500" : "bg-slate-200";

        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0 last:flex-initial">
            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${circleCls}`}>
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-[11px] whitespace-nowrap transition-colors ${labelCls}`}>
                {step.label}
              </span>
            </div>

            {/* Connector bar (not after last step) */}
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 transition-colors ${barCls}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Preset step lists ─────────────────────────────────────────────────────────

export const QUOTATION_LIFECYCLE_LO: WorkflowStep[] = [
  { key: "START",       label: "ເລີ່ມຕົ້ນ" },
  { key: "DRAFT",       label: "ຮ່າງເອກະສານ" },
  { key: "QUOTATION",   label: "ໃບສະເໜີລາຄາ" },
  { key: "BILLING",     label: "ໃບເກັບເງິນ" },
  { key: "RECEIPT",     label: "ໃບຮັບເງິນ" },
  { key: "DONE",        label: "ສິ້ນສຸດ" },
];

export const QUOTATION_LIFECYCLE_TH: WorkflowStep[] = [
  { key: "START",       label: "เริ่มต้น" },
  { key: "DRAFT",       label: "ร่างเอกสาร" },
  { key: "QUOTATION",   label: "ใบเสนอราคา" },
  { key: "BILLING",     label: "ใบแจ้งหนี้" },
  { key: "RECEIPT",     label: "ใบเสร็จ" },
  { key: "DONE",        label: "สิ้นสุด" },
];

export const QUOTATION_LIFECYCLE_EN: WorkflowStep[] = [
  { key: "START",       label: "Start" },
  { key: "DRAFT",       label: "Draft" },
  { key: "QUOTATION",   label: "Quotation" },
  { key: "BILLING",     label: "Billing Note" },
  { key: "RECEIPT",     label: "Receipt" },
  { key: "DONE",        label: "Done" },
];

export function quotationLifecycle(locale: string): WorkflowStep[] {
  if (locale === "th") return QUOTATION_LIFECYCLE_TH;
  if (locale === "en") return QUOTATION_LIFECYCLE_EN;
  return QUOTATION_LIFECYCLE_LO;
}

/**
 * Map QuotationStatus / finance doc state → workflow step key.
 *  - DRAFT / SENT       → "QUOTATION"
 *  - APPROVED           → "BILLING" (became billable)
 *  - CONVERTED          → "BILLING" (turned into a job, billing flow next)
 *  - With invoice paid  → "RECEIPT"
 *  - Fully delivered    → "DONE"
 */
export function quotationStatusToStep(
  status: string | null | undefined,
  hasInvoice = false,
  isPaid = false,
  isDelivered = false
): string {
  if (isDelivered)              return "DONE";
  if (isPaid)                   return "RECEIPT";
  if (hasInvoice)               return "BILLING";
  if (status === "CONVERTED" || status === "APPROVED") return "BILLING";
  if (status === "SENT")        return "QUOTATION";
  if (status === "DRAFT")       return "DRAFT";
  return "START";
}
