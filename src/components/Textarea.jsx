import { forwardRef } from "react";

const Textarea = forwardRef(function Textarea(
  { className = "", id, rows = 3, error, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      id={id}
      rows={rows}
      className={`field field-textarea textarea-control${error ? " is-invalid" : ""} ${className}`.trim()}
      aria-invalid={error ? "true" : undefined}
      {...props}
    />
  );
});

export default Textarea;
