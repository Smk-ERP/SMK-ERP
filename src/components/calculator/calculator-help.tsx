"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { Info, ChevronDown, ChevronUp, Ruler, Layers, Cpu, Wrench, Truck, Zap, Percent, TrendingUp, Receipt } from "lucide-react";

export function CalculatorHelp() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2 font-semibold">
          <Info className="h-5 w-5 text-cyan-600" />
          <span>{t("calculator.howItWorks")}</span>
        </div>
        {open ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t bg-gradient-to-br from-cyan-50/40 to-slate-50 p-4 sm:p-6 space-y-6">
          {/* Infographic flow */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">{t("calculator.formula.title")}</h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <FlowStep n={1} icon={<Ruler className="h-5 w-5" />} title="Area" formula="W × H ÷ 1M" />
              <FlowStep n={2} icon={<Layers className="h-5 w-5" />} title="Material" formula="× price × qty" />
              <FlowStep n={3} icon={<Percent className="h-5 w-5" />} title="Waste + OH" formula="+ %" />
              <FlowStep n={4} icon={<TrendingUp className="h-5 w-5" />} title="Markup" formula="× (1 + %)" />
              <FlowStep n={5} icon={<Receipt className="h-5 w-5" />} title="VAT" formula="+ 7%" last />
            </div>
          </div>

          {/* Formula text */}
          <div className="rounded-lg bg-white border p-4 text-sm font-mono leading-relaxed">
            <p>{t("calculator.formula.step1")}</p>
            <p>{t("calculator.formula.step2")}</p>
            <p>{t("calculator.formula.step3")}</p>
            <p>{t("calculator.formula.step4")}</p>
            <p>{t("calculator.formula.step5")}</p>
          </div>

          {/* Field guide grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <HintCard icon={<Ruler className="h-4 w-4" />} title={t("calculator.width")} body={t("calculator.hints.size")} />
            <HintCard icon={<Layers className="h-4 w-4" />} title={t("calculator.materialPerSqm")} body={t("calculator.hints.material")} />
            <HintCard icon={<Zap className="h-4 w-4" />} title={t("calculator.ledModule")} body={t("calculator.hints.led")} />
            <HintCard icon={<Cpu className="h-4 w-4" />} title={t("calculator.machine")} body={t("calculator.hints.machine")} />
            <HintCard icon={<Wrench className="h-4 w-4" />} title={t("calculator.labor")} body={t("calculator.hints.labor")} />
            <HintCard icon={<Percent className="h-4 w-4" />} title={t("calculator.wastePercent")} body={t("calculator.hints.waste")} />
            <HintCard icon={<Percent className="h-4 w-4" />} title={t("calculator.overheadPercent")} body={t("calculator.hints.overhead")} />
            <HintCard icon={<TrendingUp className="h-4 w-4" />} title={t("calculator.profitPercent")} body={t("calculator.hints.profit")} />
            <HintCard icon={<Truck className="h-4 w-4" />} title="Channel" body={t("calculator.hints.channel")} />
          </div>
        </div>
      )}
    </Card>
  );
}

function FlowStep({
  n, icon, title, formula, last
}: { n: number; icon: React.ReactNode; title: string; formula: string; last?: boolean }) {
  return (
    <div className="relative">
      <div className="flex flex-col items-center text-center bg-white rounded-lg border p-3 shadow-sm h-full">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-cyan-100 text-cyan-700 mb-2">
          {icon}
        </div>
        <div className="text-xs text-muted-foreground">Step {n}</div>
        <div className="font-semibold text-sm mt-0.5">{title}</div>
        <div className="text-xs text-cyan-700 font-mono mt-1">{formula}</div>
      </div>
      {!last && (
        <div className="hidden md:block absolute top-1/2 right-[-6px] -translate-y-1/2 text-cyan-400 z-10 text-lg font-bold">→</div>
      )}
    </div>
  );
}

function HintCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-lg bg-white border p-3">
      <div className="flex items-center gap-1.5 text-foreground font-medium mb-1">
        <span className="text-cyan-600">{icon}</span>
        <span>{title}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
