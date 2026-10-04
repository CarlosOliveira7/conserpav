import { forwardRef } from "react";

const Input = forwardRef(function Input(
  { className = "", id, type = "text", error, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      id={id}
      type={type}
      className={`field input-control${error ? " is-invalid" : ""} ${className}`.trim()}
      aria-invalid={error ? "true" : undefined}
      {...props}
    />
  );
});

export default Input;
