import { useMemo } from 'react';
import CalculatorLayout from '../components/CalculatorLayout.jsx';
import { useCalculator } from '../utils/useCalculator.js';
import { num, computeTotals } from '../utils/calculations.js';

export default function LightboxCalculator() {
  const calc = useCalculator({
    faceMaterialCost: '',
    sideFrameCost: '',
    backPlateCost: '',
    ledCost: '',
    powerSupplyCost: '',
    machineCost: '',
    assemblyExtraCost: '',
  });
  const { values, setField, reset, wastePercent, overheadPercent, profitPercent } =
    calc;

  const totals = useMemo(() => {
    const materialCost =
      num(values.faceMaterialCost) +
      num(values.sideFrameCost) +
      num(values.backPlateCost);
    const laborCost =
      num(values.laborRate) * num(values.workingDays) +
      num(values.assemblyExtraCost);
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
      title="Lightbox Letter"
      subtitle="Built lightbox-style letter with face, side frame and back plate."
      values={values}
      setField={setField}
      totals={totals}
      reset={reset}
      ledLabel="LED cost"
      materialFields={[
        { name: 'faceMaterialCost', label: 'Face material cost' },
        { name: 'sideFrameCost', label: 'Side frame cost' },
        { name: 'backPlateCost', label: 'Back plate cost' },
      ]}
      laborExtraFields={[
        {
          name: 'assemblyExtraCost',
          label: 'Assembly labor extra cost',
          hint: 'Added on top of labor rate * working days',
        },
      ]}
    />
  );
}
