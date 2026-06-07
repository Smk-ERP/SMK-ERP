import { useMemo, useState } from 'react';
import { num, computeTotals } from './calculations.js';

export function useCalculator(initialExtras = {}) {
  const baseDefaults = {
    projectName: '',
    customerName: '',
    // LED & Power
    ledCost: '',
    powerSupplyCost: '',
    machineCost: '',
    // Labor
    laborRate: 300,
    workingDays: '',
    // Transport
    distanceKm: '',
    transportPerKm: '',
    // Margins
    wastePreset: 10,
    wasteCustom: '',
    overheadPreset: 10,
    overheadCustom: '',
    profitPreset: 30,
    profitCustom: '',
  };

  const defaults = { ...baseDefaults, ...initialExtras };
  const [values, setValues] = useState(defaults);

  const setField = (name, val) => {
    setValues((prev) => ({ ...prev, [name]: val }));
  };

  const reset = () => setValues(defaults);

  const wastePercent =
    values.wastePreset === 'custom'
      ? num(values.wasteCustom)
      : num(values.wastePreset);
  const overheadPercent =
    values.overheadPreset === 'custom'
      ? num(values.overheadCustom)
      : num(values.overheadPreset);
  const profitPercent =
    values.profitPreset === 'custom'
      ? num(values.profitCustom)
      : num(values.profitPreset);

  return {
    values,
    setField,
    reset,
    wastePercent,
    overheadPercent,
    profitPercent,
    computeTotals,
    useMemo,
    num,
  };
}
