import { useEffect, useState } from "react";
import { FileBarChart2, Copy, Check, Printer } from "lucide-react";
import DatePickerField from "../components/DatePickerField";
import PageHeader from "../components/PageHeader";
import ProjectSelect from "../components/ProjectSelect";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import * as api from "../lib/api";
import {
  addWorkingDays,
  formatDisplayDate,
  getPeriodEnd,
  getWeekStartsBetween,
  isMonday,
  normalizeClosingPeriod,
} from "../lib/dateUtils";
import { formatCurrency } from "../lib/format";

export default function RelatoriosPage() {
  const {
    activeProject,
    activeEmployees,
    closingPeriod,
    reportStartDate,
    reportEndDate,
    setReportDateRange,
  } = useApp();
  const { showError } = useToast();
  const [startDate, setStartDate] = useState(reportStartDate);
  const [endDate, setEndDate] = useState(reportEndDate);
  const [rows, setRows] = useState([]);
  const [totalConsolidado, setTotalConsolidado] = useState(0);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    setStartDate(reportStartDate);
    setEndDate(reportEndDate);
  }, [reportStartDate, reportEndDate]);

  useEffect(() => {
    if (!activeProject || !activeEmployees.length || !startDate || !endDate || startDate > endDate) {
      setRows([]);
      setTotalConsolidado(0);
      setReportLoading(false);
      return undefined;
    }

    let cancelled = false;
    setReportLoading(true);
    const weekStarts = getWeekStartsBetween(startDate, endDate);

    api.fetchReport({
      projectId: activeProject.id,
      weeks: weekStarts,
      startDate,
      endDate,
    }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        showError("Não foi possível carregar o relatório deste período.");
        setRows([]);
        setTotalConsolidado(0);
      } else if (data) {
        setRows(data.rows || []);
        setTotalConsolidado(data.total_consolidado || 0);
      }
      setReportLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activeProject, activeEmployees, startDate, endDate, showError]);

  const handleStartDateChange = (event) => {
    const nextStartDate = event.target.value;
    if (!isMonday(nextStartDate)) {
      showError("O período só pode começar em uma segunda-feira.");
      return;
    }
    setStartDate(nextStartDate);
    if (nextStartDate) {
      const nextEndDate = normalizeClosingPeriod(activeProject?.closing_period) === "semanal"
        ? getPeriodEnd(nextStartDate, "semanal")
        : addWorkingDays(nextStartDate, 12);
      setEndDate(nextEndDate);
      setReportDateRange(nextStartDate, nextEndDate);
    }
  };

  const reportReady = !reportLoading && activeEmployees.length > 0 && rows.length === activeEmployees.length;

  return (
    <div className="page">
      <PageHeader icon={FileBarChart2} title="Relatórios e fechamento" />
      <ProjectSelect />

      {!activeProject ? (
        <p className="empty-box">Selecione uma obra para ver o fechamento.</p>
      ) : !activeEmployees.length ? (
        <p className="empty-box">Cadastre funcionários nesta obra para gerar o relatório.</p>
      ) : (
        <section className="panel report-panel" aria-live="polite">
          <div className="print-letterhead" aria-hidden="true">
            <div className="print-letterhead-brand">
              <img src="/logo-conserpav.png" alt="" className="print-letterhead-mark" />
              <div>
                <strong>CONSERPAV</strong>
                <span>Controle de Frequência de Obras</span>
              </div>
            </div>
            <div className="print-letterhead-meta">
              <span>{activeProject.name}</span>
              <span className="print-closing-badge">
                Fechamento {closingPeriod === "semanal" ? "semanal" : "quinzenal"}
              </span>
              <span>
                Período de {formatDisplayDate(startDate)} a {formatDisplayDate(endDate)}
              </span>
            </div>
          </div>

          <div className="report-head-row">
            <div>
              <h2 className="form-title">Relatório de pagamento</h2>
              <div className="report-period-picker" aria-label="Período do relatório">
                <DatePickerField
                  label={`Início ${closingPeriod === "semanal" ? "semana" : "quinzena"}`}
                  value={startDate}
                  onChange={handleStartDateChange}
                  mondayOnly
                />
                <span className="report-period-separator">até</span>
                <DatePickerField label="Fim" value={endDate} readOnly />
              </div>
            </div>
            <div className="report-head-actions">
              <button
                type="button"
                className="print-report-button"
                onClick={() => window.print()}
                disabled={!reportReady}
                aria-disabled={!reportReady}
              >
                <Printer size={16} />
                {reportLoading ? "Atualizando…" : "Gerar relatório"}
              </button>
            </div>
          </div>

          <div className="total-consolidado-card">
            <span className="total-consolidado-label">
              Total consolidado do período
            </span>
            <strong className="total-consolidado-value">{formatCurrency(totalConsolidado)}</strong>
          </div>

          <div className="report-table-head" aria-hidden="true">
            <span>Funcionário · função</span>
            <span className="report-status-full">Diárias completas</span>
            <span className="report-status-half">Meias diárias</span>
            <span className="report-status-absent">Ausentes</span>
            <span>A receber</span>
            <span>Chave Pix</span>
          </div>

          <div className={`report-list${reportLoading ? " is-loading" : ""}`}>
            {reportLoading && (
              <span className="report-loading-indicator" role="status">
                Atualizando período...
              </span>
            )}
            {rows.map(({ employee, full, half, absent, total }) => (
              <ReportRow
                key={employee.id}
                employee={employee}
                full={full}
                half={half}
                absent={absent}
                total={total}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ReportRow({ employee, full, half, absent, total }) {
  const { showError } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!employee.pix_key) return;
    try {
      await navigator.clipboard.writeText(employee.pix_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 1700);
    } catch {
      showError("Não foi possível copiar a chave Pix. Selecione e copie manualmente.");
    }
  };

  return (
    <div className="report-row">
      <strong data-label="Funcionário">
        {employee.name} · {employee.role}
      </strong>
      <span className="report-status-full" data-label="Diárias completas">{full}</span>
      <span className="report-status-half" data-label="Meias diárias">{half}</span>
      <span className="report-status-absent" data-label="Ausentes">{absent}</span>
      <span data-label="A receber" className="report-total">
        {formatCurrency(total)}
      </span>
      <div className="pix-box" data-label="Chave Pix">
        <span className="pix-value">{employee.pix_key || "Chave Pix não informada"}</span>
        <button
          type="button"
          className="copy-pix"
          onClick={handleCopy}
          disabled={!employee.pix_key}
          aria-label={`Copiar chave Pix de ${employee.name}`}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
        </button>
      </div>
    </div>
  );
}
