export default function SegmentedControl({
  options,
  value,
  onChange,
  ariaLabel,
  className = "",
  disabled = false,
}) {
  return (
    <div
      className={`segmented-control ${className}`.trim()}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            className={`segmented-option${isSelected ? " is-selected" : ""}`}
            onClick={() => {
              if (!isSelected && onChange) {
                onChange(option.value);
              }
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
