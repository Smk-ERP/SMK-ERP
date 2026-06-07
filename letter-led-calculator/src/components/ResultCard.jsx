import { formatTHB, formatPercent } from '../utils/calculations.js';

function Row({ label, value, strong = false, accent = false }) {
  return (
    <div
      className={`flex justify-between items-baseline py-2 ${
        strong ? 'border-t border-slate-200 mt-1 pt-3' : ''
      }`}
    >
      <span
        className={`text-sm ${
          strong ? 'font-semibold text-slate-800' : 'text-slate-600'
        }`}
      >
        {label}
      </span>
      <span
        className={`tabular-nums ${
          accent
            ? 'text-brand-600 font-bold text-lg'
            : strong
              ? 'font-semibold text-slate-900'
              : 'text-slate-800'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function ResultCard({ totals, projectName, customerName }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6 sticky top-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Price Summary</h2>
        {(projectName || customerName) && (
          <div className="mt-1 text-xs text-slate-500 space-y-0.5">
            {projectName && (
              <div>
                <span className="font-medium">Project:</span> {projectName}
              </div>
            )}
            {customerName && (
              <div>
                <span className="font-medium">Customer:</span> {customerName}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="divide-y divide-slate-100">
        <Row label="Material Cost" value={formatTHB(totals.materialCost)} />
        <Row label="LED Cost" value={formatTHB(totals.ledCost)} />
        <Row label="Power Supply Cost" value={formatTHB(totals.powerSupplyCost)} />
        <Row label="Machine Cost" value={formatTHB(totals.machineCost)} />
        <Row label="Labor Cost" value={formatTHB(totals.laborCost)} />
        <Row label="Transport Cost" value={formatTHB(totals.transportCost)} />
      </div>

      <Row label="Subtotal" value={formatTHB(totals.subtotal)} strong />
      <Row label="Waste Cost" value={formatTHB(totals.wasteCost)} />
      <Row label="Overhead Cost" value={formatTHB(totals.overheadCost)} />
      <Row label="Total Cost" value={formatTHB(totals.totalCost)} strong />

      <div className="mt-4 rounded-xl bg-brand-50 border border-brand-100 p-4">
        <div className="flex justify-between items-baseline">
          <span className="text-sm font-medium text-brand-700">
            Selling Price
          </span>
          <span className="text-2xl font-bold text-brand-700 tabular-nums">
            {formatTHB(totals.sellingPrice)}
          </span>
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-slate-600">Gross Profit</span>
          <span className="font-semibold text-emerald-600 tabular-nums">
            {formatTHB(totals.grossProfit)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Profit Margin</span>
          <span className="font-semibold text-emerald-600 tabular-nums">
            {formatPercent(totals.profitMargin)}
          </span>
        </div>
      </div>
    </div>
  );
}
