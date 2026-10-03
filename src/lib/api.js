import { request, setToken, clearToken } from "./http";
// Garante que só gravamos 'semanal' ou 'quinzenal' no banco, mesmo que algo
// inesperado chegue aqui.
import { DAY_KEYS, normalizeClosingPeriod } from "./dateUtils";

/**
 * Camada de acesso a dados. Todas as funções retornam { data, error } e nunca
 * lançam exceções, para que a UI sempre saiba tratar o resultado de forma previsível.
 *
 * ALTERAÇÃO (migração Supabase -> PostgreSQL próprio): as chamadas deixaram de
 * usar o cliente Supabase e passaram a falar com a API REST em /server. A
 * assinatura de cada função foi mantida, então AppContext/AuthContext mudam pouco.
 */

async function run(promise) {
  const result = await promise;
  if (result.error) {
    // eslint-disable-next-line no-console
    console.error(result.error);
  }
  return result;
}

// ---------- Obras ----------

export function fetchProjects() {
  return run(request("GET", "/projects"));
}

// Recebe também o período de fechamento ("semanal" ou "quinzenal"); sem o
// segundo argumento cai no padrão quinzenal.
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

// O período de fechamento pode ter 1 semana (semanal) ou 2 (quinzenal); a função
// recebe a LISTA de "week_start" do período e busca todas de uma vez.
export function fetchAttendanceForWeeks(weekStarts) {
  return run(request("GET", `/attendance?weeks=${encodeURIComponent(weekStarts.join(","))}`));
}

/** Grava (ou atualiza) a marcação de um dia. A API usa upsert para evitar corrida de estados. */
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

export async function signInWithPassword(email, password) {
  const result = await run(
    request("POST", "/auth/login", { email: email.trim().toLowerCase(), password }, { skipExpire: true })
  );
  if (result.data?.token) setToken(result.data.token);
  return result;
}

export function fetchCurrentUser() {
  return request("GET", "/auth/me");
}

export function signOut() {
  clearToken();
  return Promise.resolve({ data: null, error: null });
}

export function sendPasswordResetEmail(email) {
  return run(request("POST", "/auth/forgot", { email: email.trim().toLowerCase() }));
}

/** Conclui a recuperação de senha usando o token recebido por e-mail. */
export function resetPasswordWithToken(token, password) {
  return run(request("POST", "/auth/reset", { token, password }, { skipExpire: true }));
}

/** Troca de senha de quem já está logado (exige a senha atual). */
export function updatePassword(currentPassword, newPassword) {
  return run(request("PUT", "/auth/password", { currentPassword, newPassword }, { skipExpire: true }));
}

/** Troca de e-mail de quem já está logado (exige a senha atual). */
export async function updateEmail(newEmail, currentPassword) {
  const result = await run(
    request("PUT", "/auth/email", { newEmail: newEmail.trim().toLowerCase(), currentPassword }, { skipExpire: true })
  );
  if (result.data?.token) setToken(result.data.token);
  return result;
}
