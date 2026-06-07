import { Link } from 'react-router-dom';
import InputField from './InputField.jsx';
import SelectField from './SelectField.jsx';
import ResultCard from './ResultCard.jsx';
import {
  WASTE_PRESETS,
  OVERHEAD_PRESETS,
  PROFIT_PRESETS,
  formatTHB,
  formatPercent,
} from '../utils/calculations.js';

function Section({ title, children }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6">
      <h3 className="text-base font-semibold text-slate-800 mb-4">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

export default function CalculatorLayout({
  title,
  subtitle,
  values,
  setField,
  totals,
  materialFields,
  ledLabel = 'LED module cost',
  showPowerSupply = true,
  showMachine = true,
  showLed = true,
  ledExtraFields = [],
  machineLabel = 'Machine cost',
  laborExtraFields = [],
  reset,
}) {
  const handleCopy = async () => {
    const lines = [
      `Project: ${values.projectName || '-'}`,
      `Customer: ${values.customerName || '-'}`,
      `Calculator: ${title}`,
      '',
      `Material Cost: ${formatTHB(totals.materialCost)}`,
      `LED Cost: ${formatTHB(totals.ledCost)}`,
      `Power Supply Cost: ${formatTHB(totals.powerSupplyCost)}`,
      `Machine Cost: ${formatTHB(totals.machineCost)}`,
      `Labor Cost: ${formatTHB(totals.laborCost)}`,
      `Transport Cost: ${formatTHB(totals.transportCost)}`,
      `Subtotal: ${formatTHB(totals.subtotal)}`,
      `Waste Cost: ${formatTHB(totals.wasteCost)}`,
      `Overhead Cost: ${formatTHB(totals.overheadCost)}`,
      `Total Cost: ${formatTHB(totals.totalCost)}`,
      `Selling Price: ${formatTHB(totals.sellingPrice)}`,
      `Gross Profit: ${formatTHB(totals.grossProfit)}`,
      `Profit Margin: ${formatPercent(totals.profitMargin)}`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(lines);
      alert('Result copied to clipboard');
    } catch {
      window.prompt('Copy the result below:', lines);
    }
  };

  const handlePrint = () => window.print();

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 no-print">
        <div>
          <Link
            to="/"
            className="text-sm text-brand-600 hover:text-brand-700 mb-2 inline-block"
          >
            &larr; Back to calculators
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-2 text-sm rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium"
          >
            Copy Result
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-2 text-sm rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium"
          >
            Print
          </button>
          <button
            type="button"
            onClick={reset}
            className="px-3 py-2 text-sm rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 font-medium"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Section title="Project Details">
            <InputField
              label="Project name"
              name="projectName"
              type="text"
              value={values.projectName}
              onChange={setField}
              placeholder="e.g. Front Office Sign"
            />
            <InputField
              label="Customer name"
              name="customerName"
              type="text"
              value={values.customerName}
              onChange={setField}
              placeholder="e.g. ABC Co., Ltd."
            />
          </Section>

          <Section title="Materials">
            {materialFields.map((f) => (
              <InputField
                key={f.name}
                label={f.label}
                name={f.name}
                value={values[f.name]}
                onChange={setField}
                suffix={f.suffix || 'THB'}
                hint={f.hint}
              />
            ))}
          </Section>

          {(showLed || ledExtraFields.length > 0 || showPowerSupply) && (
            <Section title="LED & Power">
              {showLed && (
                <InputField
                  label={ledLabel}
                  name="ledCost"
                  value={values.ledCost}
                  onChange={setField}
                  suffix="THB"
                />
              )}
              {ledExtraFields.map((f) => (
                <InputField
                  key={f.name}
                  label={f.label}
                  name={f.name}
                  value={values[f.name]}
                  onChange={setField}
                  suffix={f.suffix || 'THB'}
                  hint={f.hint}
                />
              ))}
              {showPowerSupply && (
                <InputField
                  label="Power supply cost"
                  name="powerSupplyCost"
                  value={values.powerSupplyCost}
                  onChange={setField}
                  suffix="THB"
                />
              )}
            </Section>
          )}

          {showMachine && (
            <Section title="Machine">
              <InputField
                label={machineLabel}
                name="machineCost"
                value={values.machineCost}
                onChange={setField}
                suffix="THB"
              />
            </Section>
          )}

          <Section title="Labor">
            <InputField
              label="Labor rate per day"
              name="laborRate"
              value={values.laborRate}
              onChange={setField}
              suffix="THB/day"
              hint="Default 300 THB/day"
            />
            <InputField
              label="Working days"
              name="workingDays"
              value={values.workingDays}
              onChange={setField}
              suffix="days"
            />
            {laborExtraFields.map((f) => (
              <InputField
                key={f.name}
                label={f.label}
                name={f.name}
                value={values[f.name]}
                onChange={setField}
                suffix={f.suffix || 'THB'}
                hint={f.hint}
              />
            ))}
          </Section>

          <Section title="Transport">
            <InputField
              label="Distance"
              name="distanceKm"
              value={values.distanceKm}
              onChange={setField}
              suffix="km"
            />
            <InputField
              label="Transport cost per km"
              name="transportPerKm"
              value={values.transportPerKm}
              onChange={setField}
              suffix="THB/km"
            />
          </Section>

          <Section title="Margins">
            <div>
              <SelectField
                label="Waste level"
                name="wastePreset"
                value={values.wastePreset}
                onChange={setField}
                options={WASTE_PRESETS}
              />
              {values.wastePreset === 'custom' && (
                <div className="mt-3">
                  <InputField
                    label="Custom waste %"
                    name="wasteCustom"
                    value={values.wasteCustom}
                    onChange={setField}
                    suffix="%"
                  />
                </div>
              )}
            </div>
            <div>
              <SelectField
                label="Overhead"
                name="overheadPreset"
                value={values.overheadPreset}
                onChange={setField}
                options={OVERHEAD_PRESETS}
                hint="Default 10% (range 10-15%)"
              />
              {values.overheadPreset === 'custom' && (
                <div className="mt-3">
                  <InputField
                    label="Custom overhead %"
                    name="overheadCustom"
                    value={values.overheadCustom}
                    onChange={setField}
                    suffix="%"
                  />
                </div>
              )}
            </div>
            <div className="sm:col-span-2">
              <SelectField
                label="Profit"
                name="profitPreset"
                value={values.profitPreset}
                onChange={setField}
                options={PROFIT_PRESETS}
                hint="Default 30% (range 30-45%)"
              />
              {values.profitPreset === 'custom' && (
                <div className="mt-3">
                  <InputField
                    label="Custom profit %"
                    name="profitCustom"
                    value={values.profitCustom}
                    onChange={setField}
                    suffix="%"
                  />
                </div>
              )}
            </div>
          </Section>
        </div>

        <div className="lg:col-span-1">
          <ResultCard
            totals={totals}
            projectName={values.projectName}
            customerName={values.customerName}
          />
        </div>
      </div>
    </div>
  );
}
