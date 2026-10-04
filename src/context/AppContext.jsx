import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as api from "../lib/api";
import { subscribeToChanges } from "../lib/realtime";
import { useAuth } from "./AuthContext";
import {
  getWeekStart,
  DAY_KEYS,
  getPeriodWeekStarts,
  getWeekStartsBetween,
  getWorkingDatesBetween,
  getAttendanceSlot,
  addPeriods,
  addWeeks,
  addWorkingDays,
  normalizePeriodStart,
  normalizeClosingPeriod,
} from "../lib/dateUtils";
import { validateProjectName, validateEmployee } from "../lib/validation";
import { useToast } from "./ToastContext";

const AppContext = createContext(null);

const ATTENDANCE_CYCLE = ["absent", "full", "half"];
const PERIOD_START_STORAGE_KEY = "chamada:periodStart";

function getSavedPeriodStart() {
  try {
    const saved = localStorage.getItem(PERIOD_START_STORAGE_KEY);
    if (saved && /^\d{4}-\d{2}-\d{2}$/.test(saved)) return normalizePeriodStart(saved);
  } catch {
    // Storage may be unavailable; use the current calendar week.
  }
  return getWeekStart();
}

function attendanceKey(employeeId, weekStart, day) {
  return `${employeeId}::${weekStart}::${day}`;
}

export function AppProvider({ children }) {
  const { showSuccess, showError } = useToast();
  const { isAuthenticated } = useAuth();

  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [activeProjectId, setActiveProjectId] = useState(null);
  const [homePeriodStart, setHomePeriodStart] = useState(getSavedPeriodStart);
  const [periodStart, setPeriodStart] = useState(homePeriodStart);
  const [reportStartDate, setReportStartDate] = useState(homePeriodStart);
  const [reportEndDate, setReportEndDate] = useState(() => addWorkingDays(homePeriodStart, 12));
  const [attendance, setAttendance] = useState(new Map());
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [pendingCells, setPendingCells] = useState(new Set());
  const [reloadTick, setReloadTick] = useState(0);

  const [savingProject, setSavingProject] = useState(false);
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [savingExpense, setSavingExpense] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);

  const hasHydratedActiveProject = useRef(false);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) || null,
    [projects, activeProjectId]
  );

  const closingPeriod = normalizeClosingPeriod(activeProject?.closing_period);

  const periodWeekStarts = useMemo(
    () => getPeriodWeekStarts(periodStart, closingPeriod),
    [periodStart, closingPeriod]
  );

  const reportWeekStarts = useMemo(
    () => getWeekStartsBetween(reportStartDate, reportEndDate).slice(0, 2),
    [reportStartDate, reportEndDate]
  );

  useEffect(() => {
    const normalizedStart = normalizePeriodStart(homePeriodStart);
    const periodEnd = addWorkingDays(normalizedStart, closingPeriod === "semanal" ? 6 : 12);
    if (reportStartDate !== normalizedStart) setReportStartDate(normalizedStart);
    if (reportEndDate !== periodEnd) setReportEndDate(periodEnd);
  }, [activeProjectId, closingPeriod, homePeriodStart, reportStartDate, reportEndDate]);

  // ---------- Carga inicial ----------
  const loadAll = useCallback(async () => {
    const [
      { data: projectRows, error: projectError },
      { data: employeeRows, error: employeeError },
      { data: expenseRows, error: expenseError },
    ] = await Promise.all([api.fetchProjects(), api.fetchEmployees(), api.fetchProjectExpenses()]);

    if (projectError || employeeError || expenseError) {
      setLoadError("Não foi possível carregar os dados. Verifique sua conexão e tente novamente.");
    } else {
      setLoadError(null);
      setProjects(projectRows || []);
      setEmployees(employeeRows || []);
      setExpenses(expenseRows || []);
    }
    setInitialLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setProjects([]);
      setEmployees([]);
      setExpenses([]);
      setAttendance(new Map());
      setActiveProjectId(null);
      hasHydratedActiveProject.current = false;
      setLoadError(null);
      setInitialLoading(true);
      return;
    }
    loadAll();
  }, [isAuthenticated, loadAll]);

  // Seleciona automaticamente a primeira obra disponível ao carregar
  useEffect(() => {
    if (hasHydratedActiveProject.current || initialLoading) return;
    if (projects.length > 0) {
      setActiveProjectId(projects[0].id);
      hasHydratedActiveProject.current = true;
    }
  }, [projects, initialLoading]);

  // Se a obra ativa for excluída, cai para outra (ou nenhuma)
  useEffect(() => {
    if (activeProjectId && !projects.some((project) => project.id === activeProjectId)) {
      setActiveProjectId(projects[0]?.id ?? null);
    }
  }, [projects, activeProjectId]);

  // Esconde o relatório sempre que a obra ativa mudar
  useEffect(() => {
    setReportVisible(false);
  }, [activeProjectId]);

  // ---------- Realtime ----------
  const reportWeekStartsRef = useRef(reportWeekStarts);
  useEffect(() => {
    reportWeekStartsRef.current = reportWeekStarts;
  }, [reportWeekStarts]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    return subscribeToChanges({
      onChange: (payload) => {
        if (payload.table === "projects") {
          setProjects((current) => applyRealtimeChange(current, payload));
        } else if (payload.table === "employees") {
          setEmployees((current) => applyRealtimeChange(current, payload));
        } else if (payload.table === "project_expenses") {
          setExpenses((current) => applyRealtimeChange(current, payload));
        } else if (payload.table === "attendance_records") {
          const row = payload.new?.week_start ? payload.new : payload.old;
          if (!row || !reportWeekStartsRef.current.includes(row.week_start)) return;
          setAttendance((current) => {
            const next = new Map(current);
            const key = attendanceKey(row.employee_id, row.week_start, row.day);
            if (payload.eventType === "DELETE") {
              next.delete(key);
            } else {
              next.set(key, payload.new.status);
            }
            return next;
          });
        }
      },
      onReconnect: () => {
        loadAll();
        setReloadTick((tick) => tick + 1);
      },
    });
  }, [isAuthenticated, loadAll]);

  // ---------- Frequência: carregar as semanas do intervalo selecionado ----------
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let cancelled = false;
    setAttendanceLoading(true);

    api.fetchAttendanceForWeeks(reportWeekStarts).then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        showError("Não foi possível carregar a chamada deste período.");
      } else {
        const next = new Map();
        (data || []).forEach((record) => {
          next.set(attendanceKey(record.employee_id, record.week_start, record.day), record.status);
        });
        setAttendance(next);
      }
      setAttendanceLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [reportWeekStarts, isAuthenticated, reloadTick, showError]);

  // ---------- Obras ----------
  const addProject = useCallback(
    async (name, closingPeriod) => {
      const validationError = validateProjectName(name, projects);
      if (validationError) {
        showError(validationError);
        return { ok: false };
      }

      setSavingProject(true);
      const { data, error } = await api.createProject(name, closingPeriod);
      setSavingProject(false);

      if (error) {
        showError("Não foi possível cadastrar a obra. Tente novamente.");
        return { ok: false };
      }

      setProjects((current) => upsertById(current, data));
      setActiveProjectId(data.id);
      hasHydratedActiveProject.current = true;
      showSuccess(`Obra "${data.name}" cadastrada e aberta para chamada.`);
      return { ok: true };
    },
    [projects, showError, showSuccess]
  );

  const editProject = useCallback(
    async (id, name, closingPeriod) => {
      const validationError = validateProjectName(name, projects, id);
      if (validationError) {
        showError(validationError);
        return { ok: false };
      }

      setSavingProject(true);
      const { data, error } = await api.updateProject(id, name, closingPeriod);
      setSavingProject(false);

      if (error) {
        showError("Não foi possível atualizar a obra. Tente novamente.");
        return { ok: false };
      }

      setProjects((current) => upsertById(current, data));
      showSuccess("Obra atualizada com sucesso.");
      return { ok: true };
    },
    [projects, showError, showSuccess]
  );

  const removeProject = useCallback(
    async (id) => {
      const { error } = await api.deleteProject(id);
      if (error) {
        showError("Não foi possível excluir esta obra. Tente novamente.");
        return { ok: false };
      }

      setProjects((current) => current.filter((project) => project.id !== id));
      setEmployees((current) => current.filter((employee) => employee.project_id !== id));
      showSuccess("Obra excluída.");
      return { ok: true };
    },
    [showError, showSuccess]
  );

  // ---------- Funcionários ----------
  const addEmployee = useCallback(
    async (payload) => {
      const validationError = validateEmployee(payload, employees);
      if (validationError) {
        showError(validationError);
        return { ok: false };
      }

      setSavingEmployee(true);
      const { data, error } = await api.createEmployee(payload);
      setSavingEmployee(false);

      if (error) {
        showError("Não foi possível cadastrar o funcionário. Tente novamente.");
        return { ok: false };
      }

      setEmployees((current) => upsertById(current, data));
      setActiveProjectId(payload.projectId);
      showSuccess(`Funcionário "${data.name}" cadastrado com sucesso.`);
      return { ok: true };
    },
    [employees, showError, showSuccess]
  );

  const editEmployee = useCallback(
    async (id, payload) => {
      const validationError = validateEmployee(payload, employees, id);
      if (validationError) {
        showError(validationError);
        return { ok: false };
      }

      setSavingEmployee(true);
      const { data, error } = await api.updateEmployee(id, payload);
      setSavingEmployee(false);

      if (error) {
        showError("Não foi possível atualizar o funcionário. Tente novamente.");
        return { ok: false };
      }

      setEmployees((current) => upsertById(current, data));
      showSuccess("Funcionário atualizado com sucesso.");
      return { ok: true };
    },
    [employees, showError, showSuccess]
  );

  const removeEmployee = useCallback(
    async (id) => {
      const { error } = await api.deleteEmployee(id);
      if (error) {
        showError("Não foi possível excluir este funcionário. Tente novamente.");
        return { ok: false };
      }

      setEmployees((current) => current.filter((employee) => employee.id !== id));
      showSuccess("Funcionário excluído.");
      return { ok: true };
    },
    [showError, showSuccess]
  );

  const addExpense = useCallback(
    async (payload) => {
      if (!payload.projectId) {
        showError("Selecione uma obra antes de registrar o gasto.");
        return { ok: false };
      }

      setSavingExpense(true);
      const { data, error } = await api.createProjectExpense(payload);
      setSavingExpense(false);

      if (error) {
        showError(error.message || "Não foi possível salvar o gasto. Tente novamente.");
        return { ok: false };
      }

      setExpenses((current) => upsertById(current, data));
      setActiveProjectId(payload.projectId);
      showSuccess(`Gasto "${data.description}" salvo com sucesso.`);
      return { ok: true, expense: data };
    },
    [showError, showSuccess]
  );

  const editExpense = useCallback(
    async (id, payload) => {
      if (!payload.projectId) {
        showError("Selecione uma obra antes de editar o gasto.");
        return { ok: false };
      }

      setSavingExpense(true);
      const { data, error } = await api.updateProjectExpense(id, payload);
      setSavingExpense(false);

      if (error) {
        showError(error.message || "Não foi possível atualizar o gasto. Tente novamente.");
        return { ok: false };
      }

      setExpenses((current) => upsertById(current, data));
      showSuccess("Gasto atualizado com sucesso.");
      return { ok: true };
    },
    [showError, showSuccess]
  );

  const removeExpense = useCallback(
    async (id) => {
      const { error } = await api.deleteProjectExpense(id);
      if (error) {
        showError(error.message || "Não foi possível excluir este gasto. Tente novamente.");
        return { ok: false };
      }

      setExpenses((current) => current.filter((expense) => expense.id !== id));
      showSuccess("Gasto removido.");
      return { ok: true };
    },
    [showError, showSuccess]
  );

  const toggleExpenseSettled = useCallback(
    async (id) => {
      const expense = expenses.find((item) => item.id === id);
      if (!expense) return { ok: false };

      const { data, error } = await api.updateProjectExpense(id, {
        projectId: expense.project_id,
        description: expense.description,
        category: expense.category,
        quantity: expense.quantity,
        unitValue: expense.unit_price,
        total: expense.total,
        spentAt: expense.spent_at,
        notes: expense.notes,
        isSettled: !expense.is_settled,
      });

      if (error) {
        showError(error.message || "Não foi possível atualizar a baixa deste gasto.");
        return { ok: false };
      }

      setExpenses((current) => upsertById(current, data));
      showSuccess(data.is_settled ? "Gasto fechado." : "Gasto aberto.");
      return { ok: true, expense: data };
    },
    [expenses, showError, showSuccess]
  );

  // ---------- Frequência ----------
  const toggleAttendance = useCallback(
    async (employeeId, weekStart, day) => {
      const key = attendanceKey(employeeId, weekStart, day);

      // Previne requisições concorrentes na mesma célula em toques rápidos
      if (pendingCells.has(key)) return;

      const current = attendance.get(key) || "absent";
      const nextStatus = ATTENDANCE_CYCLE[(ATTENDANCE_CYCLE.indexOf(current) + 1) % ATTENDANCE_CYCLE.length];

      setAttendance((prev) => new Map(prev).set(key, nextStatus));
      setPendingCells((prev) => new Set(prev).add(key));

      const { error } = await api.upsertAttendance({
        employeeId,
        weekStart,
        day,
        status: nextStatus,
      });

      setPendingCells((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });

      if (error) {
        setAttendance((prev) => new Map(prev).set(key, current));
        showError("Não foi possível salvar a marcação. Tente novamente.");
      }
    },
    [attendance, pendingCells, showError]
  );

  const goToPreviousPeriod = useCallback(
    () => setPeriodStart((current) => addPeriods(current, -1, closingPeriod)),
    [closingPeriod]
  );
  const goToNextPeriod = useCallback(
    () => setPeriodStart((current) => addPeriods(current, 1, closingPeriod)),
    [closingPeriod]
  );
  const goToCurrentPeriod = useCallback(() => {
    const endDate = addWorkingDays(homePeriodStart, closingPeriod === "semanal" ? 6 : 12);
    setPeriodStart(homePeriodStart);
    setReportStartDate(homePeriodStart);
    setReportEndDate(endDate);
  }, [homePeriodStart, closingPeriod]);

  const setReportDateRange = useCallback((startDate, endDate) => {
    setReportStartDate(normalizePeriodStart(startDate));
    setReportEndDate(endDate);
  }, []);

  const setCustomPeriodStart = useCallback((startDate) => {
    if (!startDate) return;
    const monday = normalizePeriodStart(startDate);
    const endDate = addWorkingDays(monday, closingPeriod === "semanal" ? 6 : 12);
    setHomePeriodStart(monday);
    setPeriodStart(monday);
    setReportStartDate(monday);
    setReportEndDate(endDate);
    try {
      localStorage.setItem(PERIOD_START_STORAGE_KEY, monday);
    } catch {
      // Storage may be unavailable; selected period remains active until close.
    }
  }, [closingPeriod]);

  const shiftReportRange = useCallback(
    (direction) => {
      const nextStart = closingPeriod === "semanal"
        ? addWeeks(reportStartDate, direction)
        : addWeeks(reportStartDate, direction * 2);
      const nextEnd = addWorkingDays(nextStart, closingPeriod === "semanal" ? 6 : 12);
      setReportStartDate(nextStart);
      setReportEndDate(nextEnd);
    },
    [reportStartDate, closingPeriod]
  );

  // ---------- Derivados ----------
  const activeEmployees = useMemo(
    () => employees
      .filter((employee) => employee.project_id === activeProjectId)
      .sort((left, right) => left.name.localeCompare(right.name, "pt-BR", { sensitivity: "base" })),
    [employees, activeProjectId]
  );

  const projectExpenses = useMemo(
    () =>
      expenses
        .filter((expense) => expense.project_id === activeProjectId)
        .sort((left, right) => new Date(right.spent_at) - new Date(left.spent_at)),
    [expenses, activeProjectId]
  );

  const projectExpenseTotal = useMemo(
    () => projectExpenses.reduce((sum, expense) => sum + Number(expense.total || 0), 0),
    [projectExpenses]
  );

  const getAttendanceStatus = useCallback(
    (employeeId, weekStart, day) => attendance.get(attendanceKey(employeeId, weekStart, day)) || "absent",
    [attendance]
  );

  const isCellPending = useCallback(
    (employeeId, weekStart, day) => pendingCells.has(attendanceKey(employeeId, weekStart, day)),
    [pendingCells]
  );

  const summary = useMemo(() => {
    const counts = { full: 0, half: 0, absent: 0 };
    const workingDates = getWorkingDatesBetween(reportStartDate, reportEndDate);
    activeEmployees.forEach((employee) => {
      workingDates.forEach((date) => {
        const { weekStart, day } = getAttendanceSlot(date);
        const status = getAttendanceStatus(employee.id, weekStart, day);
        counts[status] += 1;
      });
    });
    return counts;
  }, [activeEmployees, reportStartDate, reportEndDate, getAttendanceStatus]);

  const firstFilledDay = useMemo(() => {
    const filledDays = reportWeekStarts.flatMap((weekStart, weekIndex) =>
      DAY_KEYS.flatMap((day) => {
        const filled = activeEmployees.some((employee) => {
          const status = getAttendanceStatus(employee.id, weekStart, day);
          return status === "full" || status === "half";
        });
        return filled ? [{ weekIndex, day }] : [];
      })
    );
    return {
      start: filledDays.find(({ day }) => day !== "sab") || null,
      end: filledDays.find(({ day }) => day === "sab") || null,
    };
  }, [activeEmployees, reportWeekStarts, getAttendanceStatus]);

  const buildReport = useCallback(() => {
    const workingDates = getWorkingDatesBetween(reportStartDate, reportEndDate);
    return activeEmployees.map((employee) => {
      const days = workingDates.map((date) => {
        const { weekStart, day } = getAttendanceSlot(date);
        return getAttendanceStatus(employee.id, weekStart, day);
      });
      const full = days.filter((status) => status === "full").length;
      const half = days.filter((status) => status === "half").length;
      const absent = days.filter((status) => status === "absent").length;
      const total = full * employee.daily_rate + half * (employee.daily_rate / 2);
      return { employee, full, half, absent, total };
    });
  }, [activeEmployees, reportStartDate, reportEndDate, getAttendanceStatus]);

  const generateReport = useCallback(() => {
    if (!activeProject || !activeEmployees.length) {
      showError("Selecione uma obra com funcionários cadastrados para gerar o relatório.");
      return;
    }
    setReportVisible(true);
  }, [activeProject, activeEmployees, showError]);

  const value = {
    projects,
    employees,
    initialLoading,
    loadError,
    activeProjectId,
    activeProject,
    activeEmployees,
    setActiveProjectId,
    periodStart,
    homePeriodStart,
    reportStartDate,
    reportEndDate,
    setReportDateRange,
    setCustomPeriodStart,
    shiftReportRange,
    periodWeekStarts,
    reportWeekStarts,
    closingPeriod,
    attendanceLoading,
    goToPreviousPeriod,
    goToNextPeriod,
    goToCurrentPeriod,
    savingProject,
    savingEmployee,
    savingExpense,
    addProject,
    editProject,
    removeProject,
    addEmployee,
    editEmployee,
    removeEmployee,
    addExpense,
    editExpense,
    removeExpense,
    toggleExpenseSettled,
    projectExpenses,
    projectExpenseTotal,
    toggleAttendance,
    getAttendanceStatus,
    isCellPending,
    firstFilledDay,
    summary,
    buildReport,
    reportVisible,
    generateReport,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function upsertById(list, item) {
  const exists = list.some((entry) => entry.id === item.id);
  return exists ? list.map((entry) => (entry.id === item.id ? item : entry)) : [...list, item];
}

function applyRealtimeChange(list, payload) {
  if (payload.eventType === "INSERT") {
    return upsertById(list, payload.new);
  }
  if (payload.eventType === "UPDATE") {
    return upsertById(list, payload.new);
  }
  if (payload.eventType === "DELETE") {
    return list.filter((entry) => entry.id !== payload.old.id);
  }
  return list;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp deve ser usado dentro de um AppProvider.");
  }
  return context;
}
