import { useMemo } from 'react';
import CalculatorLayout from '../components/CalculatorLayout.jsx';
import { useCalculator } from '../utils/useCalculator.js';
import { num, computeTotals } from '../utils/calculations.js';

export default function FrontLitCalculator() {
  const calc = useCalculator({
    letterArea: '',
    acrylicCostPerM2: '',
    sideMaterialCost: '',
    ledCost: '',
    powerSupplyCost: '',
    machineCost: '',
  });
  const { values, setField, reset, wastePercent, overheadPercent, profitPercent } =
    calc;

  const totals = useMemo(() => {
    const materialCost =
      num(values.letterArea) * num(values.acrylicCostPerM2) +
      num(values.sideMaterialCost);
    const laborCost = num(values.laborRate) * num(values.workingDays);
    const transportCost = num(values.distanceKm) * num(values.transportPerKm);

    return computeTotals({
      materialCost,
      ledCost: num(values.ledCost),
      powerSupplyCost: num(values.powerSupplyCost),
      machineCost: num(values.machineCost),
      laborCost,
      transportCost,
      wastePercent,
      overheadPercent,
      profitPercent,
    });
  }, [values, wastePercent, overheadPercent, profitPercent]);

  return (
    <CalculatorLayout
      title="Front-lit Letter"
      subtitle="Acrylic face lit from inside with LED modules."
      values={values}
      setField={setField}
      totals={totals}
      reset={reset}
      materialFields={[
        { name: 'letterArea', label: 'Letter area', suffix: 'm²' },
        {
          name: 'acrylicCostPerM2',
          label: 'Acrylic cost per m²',
          suffix: 'THB/m²',
        },
        { name: 'sideMaterialCost', label: 'Side material cost' },
      ]}
    />
  );
}
