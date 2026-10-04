import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

const Select = forwardRef(function Select(
  { className = "", id, children, error, ...props },
  ref
) {
  return (
    <div className="select-wrapper">
      <select
        ref={ref}
        id={id}
        className={`field select-control${error ? " is-invalid" : ""} ${className}`.trim()}
        aria-invalid={error ? "true" : undefined}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="select-arrow" size={18} aria-hidden="true" />
    </div>
  );
});

export default Select;
