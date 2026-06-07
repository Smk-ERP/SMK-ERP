import { useMemo } from 'react';
import CalculatorLayout from '../components/CalculatorLayout.jsx';
import { useCalculator } from '../utils/useCalculator.js';
import { num, computeTotals } from '../utils/calculations.js';

export default function BackLitCalculator() {
  const calc = useCalculator({
    letterArea: '',
    backPlateCost: '',
    letterBodyCost: '',
    spacerCost: '',
    ledCost: '',
    powerSupplyCost: '',
    machineCost: '',
  });
  const { values, setField, reset, wastePercent, overheadPercent, profitPercent } =
    calc;

  const totals = useMemo(() => {
    const materialCost =
      num(values.backPlateCost) +
      num(values.letterBodyCost) +
      num(values.spacerCost);
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
      title="Back-lit Letter"
      subtitle="Halo letter with LEDs behind, glowing on the wall."
      values={values}
      setField={setField}
      totals={totals}
      reset={reset}
      ledLabel="LED cost"
      materialFields={[
        { name: 'letterArea', label: 'Letter area', suffix: 'm²' },
        { name: 'backPlateCost', label: 'Back plate cost' },
        { name: 'letterBodyCost', label: 'Letter body cost' },
        { name: 'spacerCost', label: 'Spacer cost' },
      ]}
    />
  );
}
