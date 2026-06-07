import { useMemo } from 'react';
import CalculatorLayout from '../components/CalculatorLayout.jsx';
import { useCalculator } from '../utils/useCalculator.js';
import { num, computeTotals } from '../utils/calculations.js';

export default function EdgeLitCalculator() {
  const calc = useCalculator({
    letterArea: '',
    acrylicCostPerM2: '',
    ledStripLength: '',
    ledStripCostPerMeter: '',
    grooveCncCost: '',
    powerSupplyCost: '',
  });
  const { values, setField, reset, wastePercent, overheadPercent, profitPercent } =
    calc;

  const totals = useMemo(() => {
    const materialCost = num(values.letterArea) * num(values.acrylicCostPerM2);
    const ledCost =
      num(values.ledStripLength) * num(values.ledStripCostPerMeter);
    const machineCost = num(values.grooveCncCost);
    const laborCost = num(values.laborRate) * num(values.workingDays);
    const transportCost = num(values.distanceKm) * num(values.transportPerKm);

    return computeTotals({
      materialCost,
      ledCost,
      powerSupplyCost: num(values.powerSupplyCost),
      machineCost,
      laborCost,
      transportCost,
      wastePercent,
      overheadPercent,
      profitPercent,
    });
  }, [values, wastePercent, overheadPercent, profitPercent]);

  return (
    <CalculatorLayout
      title="Edge-lit Letter"
      subtitle="Clear acrylic lit from the edge using LED strips."
      values={values}
      setField={setField}
      totals={totals}
      reset={reset}
      showLed={false}
      machineLabel="Groove / CNC cost"
      materialFields={[
        { name: 'letterArea', label: 'Letter area', suffix: 'm²' },
        {
          name: 'acrylicCostPerM2',
          label: 'Acrylic cost per m²',
          suffix: 'THB/m²',
        },
      ]}
      ledExtraFields={[
        {
          name: 'ledStripLength',
          label: 'LED strip length',
          suffix: 'meter',
        },
        {
          name: 'ledStripCostPerMeter',
          label: 'LED strip cost per meter',
          suffix: 'THB/m',
        },
      ]}
    />
  );
}
