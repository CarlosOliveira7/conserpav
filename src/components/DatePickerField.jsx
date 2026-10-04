import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "../context/ToastContext";
import {
  formatDisplayDate,
  formatMonth,
  getCalendarDays,
  getMonthDate,
  isMonday,
  isOutsideMonth,
  shiftMonth,
} from "../lib/dateUtils";

export default function DatePickerField({
  label,
  value,
  onChange,
  mondayOnly = false,
  readOnly = false,
  tone,
}) {
  const { showError } = useToast();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => getMonthDate(value));
  const pickerRef = useRef(null);
  const days = getCalendarDays(month);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!pickerRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSelect = (date) => {
    if (!date) return;
    if (mondayOnly && !isMonday(date)) {
      showError("O período deve iniciar em uma segunda-feira.");
      return;
    }
    onChange({ target: { value: date } });
    setOpen(false);
  };

  const toneClass = tone ? ` date-tone-${tone}` : "";

  return (
    <div ref={pickerRef} className={`report-date-picker attendance-date-picker${toneClass}`}>
      <button
        type="button"
        className={`report-date-field${readOnly ? " is-read-only" : ""}`}
        onClick={() => !readOnly && setOpen((current) => !current)}
        disabled={readOnly}
        aria-disabled={readOnly}
      >
        <span className="report-date-label">{label}</span>
        <span className="report-date-value">
          <strong>{formatDisplayDate(value)}</strong>
          {!readOnly && <CalendarDays className="report-date-icon" size={18} aria-hidden="true" />}
        </span>
      </button>
      {open && !readOnly && (
        <div className="report-calendar" role="dialog" aria-label={`Escolher ${label.toLowerCase()}`}>
          <div className="report-calendar-header">
            <button type="button" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Mês anterior">
              <ChevronLeft size={16} />
            </button>
            <strong>{formatMonth(month)}</strong>
            <button type="button" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Próximo mês">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="report-calendar-weekdays" aria-hidden="true">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((day, index) => (
              <span key={`${day}-${index}`}>{day}</span>
            ))}
          </div>
          <div className="report-calendar-grid">
            {days.map((date, index) => (
              <button
                key={`${date || "empty"}-${index}`}
                type="button"
                disabled={!date || isOutsideMonth(date, month)}
                className={`${date === value ? "is-selected" : ""}${
                  date && isOutsideMonth(date, month) ? " is-outside-month" : ""
                }${date && mondayOnly && isMonday(date) ? " is-monday" : ""}${
                  date && mondayOnly && !isMonday(date) ? " is-invalid-start" : ""
                }`}
                onClick={() => handleSelect(date)}
              >
                {date ? Number(date.slice(-2)) : null}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
