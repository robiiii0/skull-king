"use client";

interface NumberPickerProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  label: string;
  disabled?: boolean;
  editable?: boolean;
}

export function NumberPicker({
  value,
  onChange,
  min,
  max,
  label,
  disabled,
  editable,
}: NumberPickerProps) {
  function handleChange(delta: number) {
    onChange(Math.max(min, Math.min(max, value + delta)));
  }

  function handleInputChange(raw: string) {
    const cleaned = raw.replace(/[^0-9]/g, "");
    if (cleaned === "") {
      onChange(min);
      return;
    }
    const n = parseInt(cleaned, 10);
    onChange(Math.max(min, Math.min(max, n)));
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm text-bone-dim uppercase tracking-widest">
        {label}
      </span>
      <div className="flex items-center gap-4">
        <button
          className="w-14 h-14 rounded-xl bg-navy-mid border border-gold/20 text-2xl font-bold text-gold
                     disabled:opacity-30 disabled:pointer-events-none select-none"
          onClick={() => handleChange(-1)}
          disabled={disabled || value <= min}
        >
          &minus;
        </button>
        {editable ? (
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="skull-title text-5xl w-16 text-center rounded-xl bg-navy-mid border-2 border-gold/30 focus:border-gold outline-none py-1 px-1"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            disabled={disabled}
          />
        ) : (
          <span className="skull-title text-5xl w-16 text-center select-none">
            {value}
          </span>
        )}
        <button
          className="w-14 h-14 rounded-xl bg-navy-mid border border-gold/20 text-2xl font-bold text-gold
                     disabled:opacity-30 disabled:pointer-events-none select-none"
          onClick={() => handleChange(1)}
          disabled={disabled || value >= max}
        >
          +
        </button>
      </div>
    </div>
  );
}
