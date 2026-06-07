// Default QC checklist template (applied when starting a new check).
// Each entry: { key, labelI18n, mandatory }
export interface QCItem { key: string; label: string; pass: boolean; note?: string }

export const DEFAULT_CHECKLIST_TEMPLATE: Omit<QCItem, "pass">[] = [
  { key: "appearance",  label: "qc.appearance" },
  { key: "size",        label: "qc.size" },
  { key: "color",       label: "qc.color" },
  { key: "led",         label: "qc.led" },
  { key: "finish",      label: "qc.finish" }
];
