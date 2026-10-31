import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

const ICONS = {
  error: AlertCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
};

/**
 * Componente padronizado de Alert/Banner para feedback visual limpo na UI.
 * @param {object} props
 * @param {"error" | "success" | "warning" | "info"} [props.variant="error"]
 * @param {string} [props.title]
 * @param {React.ReactNode} [props.children]
 * @param {string} [props.message]
 * @param {() => void} [props.onClose]
 * @param {string} [props.className=""]
 */
export default function Alert({
  variant = "error",
  title,
  message,
  children,
  onClose,
  className = "",
}) {
  const Icon = ICONS[variant] || AlertCircle;
  const content = message || children;

  if (!content) return null;

  return (
    <div
      role="alert"
      className={`app-alert app-alert-${variant} ${className}`.trim()}
      aria-live="polite"
    >
      <div className="app-alert-icon" aria-hidden="true">
        <Icon size={18} strokeWidth={2.2} />
      </div>

      <div className="app-alert-content">
        {title && <strong className="app-alert-title">{title}</strong>}
        <div className="app-alert-message">{content}</div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="app-alert-close"
          aria-label="Fechar alerta"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
