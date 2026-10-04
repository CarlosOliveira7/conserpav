import { request } from "./http";
import { DAY_KEYS, normalizeClosingPeriod } from "./dateUtils";

async function run(promise) {
  return promise;
}

// ---------- Obras ----------

export function fetchProjects() {
  return run(request("GET", "/projects"));
}

export function createProject(name, closingPeriod) {
  return run(
    request("POST", "/projects", {
      name: name.trim(),
      closing_period: normalizeClosingPeriod(closingPeriod),
    })
  );
}

export function updateProject(id, name, closingPeriod) {
  return run(
    request("PUT", `/projects/${id}`, {
      name: name.trim(),
      closing_period: normalizeClosingPeriod(closingPeriod),
    })
  );
}

export function deleteProject(id) {
  return run(request("DELETE", `/projects/${id}`));
}

// ---------- Funcionários ----------

export function fetchEmployees() {
  return run(request("GET", "/employees"));
}

function employeeBody({ name, role, dailyRate, projectId, pixKey }) {
  return {
    name: name.trim(),
    role: role.trim(),
    daily_rate: Number(dailyRate),
    project_id: projectId,
    pix_key: pixKey.trim(),
  };
}

export function createEmployee(payload) {
  return run(request("POST", "/employees", employeeBody(payload)));
}

export function updateEmployee(id, payload) {
  return run(request("PUT", `/employees/${id}`, employeeBody(payload)));
}

export function deleteEmployee(id) {
  return run(request("DELETE", `/employees/${id}`));
}

// ---------- Gastos por obra ----------

export function fetchProjectExpenses() {
  return run(request("GET", "/expenses"));
}

function expenseBody({ projectId, description, category, quantity, unitValue, total, spentAt, notes, isSettled }) {
  return {
    project_id: projectId,
    description: description.trim(),
    category: category.trim(),
    quantity: Number(quantity),
    unit_price: Number(unitValue),
    total: Number(total),
    spent_at: spentAt,
    notes: (notes || "").trim(),
    is_settled: Boolean(isSettled),
  };
}

export function createProjectExpense(payload) {
  return run(request("POST", "/expenses", expenseBody(payload)));
}

export function updateProjectExpense(id, payload) {
  return run(request("PUT", `/expenses/${id}`, expenseBody(payload)));
}

export function deleteProjectExpense(id) {
  return run(request("DELETE", `/expenses/${id}`));
}

// ---------- Frequência ----------

export function fetchAttendanceForWeeks(weekStarts) {
  return run(request("GET", `/attendance?weeks=${encodeURIComponent(weekStarts.join(","))}`));
}

export function upsertAttendance({ employeeId, weekStart, day, status }) {
  return run(
    request("PUT", "/attendance", {
      employee_id: employeeId,
      week_start: weekStart,
      day,
      status,
    })
  );
}

export function isValidDay(day) {
  return DAY_KEYS.includes(day);
}

// ---------- Autenticação ----------

export function signInWithPassword(email, password) {
  return run(
    request("POST", "/auth/login", { email: email.trim().toLowerCase(), password }, { skipExpire: true })
  );
}

export function fetchCurrentUser() {
  return request("GET", "/auth/me");
}

export function signOut() {
  return run(request("POST", "/auth/logout"));
}

export function sendPasswordResetEmail(email) {
  return run(request("POST", "/auth/forgot", { email: email.trim().toLowerCase() }));
}

export function resetPasswordWithToken(token, password) {
  return run(request("POST", "/auth/reset", { token, password }, { skipExpire: true }));
}

export function updatePassword(currentPassword, newPassword) {
  return run(request("PUT", "/auth/password", { currentPassword, newPassword }, { skipExpire: true }));
}

export function updateEmail(newEmail, currentPassword) {
  return run(
    request("PUT", "/auth/email", { newEmail: newEmail.trim().toLowerCase(), currentPassword }, { skipExpire: true })
  );
}
