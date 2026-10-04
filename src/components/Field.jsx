export default function Field({
  label,
  htmlFor,
  hint,
  error,
  required = false,
  className = "",
  children,
}) {
  return (
    <div className={`form-field ${className}`.trim()}>
      {label && (
        <label className="field-label" htmlFor={htmlFor}>
          {label}
          {required && <span className="field-required" aria-hidden="true"> *</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}
