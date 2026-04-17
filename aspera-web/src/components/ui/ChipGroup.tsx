"use client";

interface ChipGroupProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  multi?: boolean;
  capitalize?: boolean;
}

export function ChipGroup({ options, selected, onChange, multi = false, capitalize = true }: ChipGroupProps) {
  const toggle = (opt: string) => {
    if (multi) {
      onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
    } else {
      onChange(selected.includes(opt) ? [] : [opt]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isActive = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`
              px-3 py-1.5 rounded-pill text-sm font-medium transition-all duration-150
              ${isActive
                ? "bg-accent text-white shadow-glow-sm"
                : "bg-elevated text-text-secondary border border-border hover:border-border-accent hover:text-text"
              }
            `}
          >
            {capitalize ? opt.charAt(0).toUpperCase() + opt.slice(1) : opt}
          </button>
        );
      })}
    </div>
  );
}
