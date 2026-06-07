"use client";

import { useState } from "react";
import { CalculatorForm } from "@/components/calculator/calculator-form";
import { CalculatorHelp } from "@/components/calculator/calculator-help";
import { ReferenceAttachment, type ReferenceData } from "@/components/calculator/reference-attachment";
import { PageHeader } from "@/components/ui/page-header";
import { useI18n } from "@/lib/i18n/context";

export default function CalculatorPage() {
  const { t } = useI18n();
  const [reference, setReference] = useState<ReferenceData>({});

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("calculator.title")}
        breadcrumb={[{ label: t("nav.dashboard"), href: "/dashboard" }, { label: t("calculator.title") }]}
      />

      <CalculatorHelp />

      <CalculatorForm />

      <ReferenceAttachment value={reference} onChange={setReference} />
    </div>
  );
}
