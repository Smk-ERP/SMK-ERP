export default function InputField({
  label,
  name,
  value,
  onChange,
  type = 'number',
  step = 'any',
  min = 0,
  placeholder = '',
  suffix = '',
  prefix = '',
  hint = '',
}) {
  const handle = (e) => {
    const v = e.target.value;
    if (type === 'number') {
      if (v === '') {
        onChange(name, '');
        return;
      }
      const n = Number(v);
      if (!Number.isFinite(n)) return;
      if (n < 0) {
        onChange(name, 0);
        return;
      }
      onChange(name, v);
    } else {
      onChange(name, v);
    }
  };

  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </span>
      <div className="relative">
        {prefix && (
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">
            {prefix}
          </span>
        )}
        <input
          type={type}
          inputMode={type === 'number' ? 'decimal' : undefined}
          step={type === 'number' ? step : undefined}
          min={type === 'number' ? min : undefined}
          name={name}
          value={value ?? ''}
          onChange={handle}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm
            focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 focus:outline-none
            ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-12' : ''}`}
        />
        {suffix && (
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 text-xs">
            {suffix}
          </span>
        )}
      </div>
      {hint && <span className="block text-xs text-slate-400 mt-1">{hint}</span>}
    </label>
  );
}
