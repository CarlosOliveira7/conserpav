import crypto from "node:crypto";
import cors from "cors";
import bcrypt from "bcryptjs";
import express from "express";
import { config } from "./config.js";
import { query } from "./db.js";
import {
  clearLoginFailures,
  loginLimiter,
  registerLoginFailure,
  requireAuth,
  signToken,
} from "./auth.js";
import { eventsHandler, initEvents } from "./events.js";
import { sendPasswordResetEmail } from "./mailer.js";

const app = express();
app.set("trust proxy", 1);
app.use(
  cors({
    origin(origin, callback) {
      // Permite requisições sem Origin (curl, healthchecks) e as origens configuradas.
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origem não permitida pelo CORS"));
    },
  })
);
app.use(express.json({ limit: "100kb" }));

const DAYS = ["seg", "ter", "qua", "qui", "sex", "sab"];
const STATUSES = ["absent", "full", "half"];
const PERIODS = ["semanal", "quinzenal"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MIN_PASSWORD = 6;

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const bad = (res, message, status = 400) => res.status(status).json({ error: message });
const text = (value) => (typeof value === "string" ? value.trim() : "");
const normalizePeriod = (value) => (PERIODS.includes(value) ? value : "quinzenal");

// ---------- Saúde ----------
app.get(
  "/api/health",
  wrap(async (_req, res) => {
    await query("select 1");
    res.json({ ok: true });
  })
);

// ---------- Autenticação ----------
app.post(
  "/api/auth/login",
  wrap(async (req, res) => {
    const email = text(req.body.email).toLowerCase();
    const password = typeof req.body.password === "string" ? req.body.password : "";
    if (!email || !password) return bad(res, "Preencha e-mail e senha.");

    const key = `${req.ip}|${email}`;
    if (loginLimiter(key).blocked) {
      return bad(res, "Muitas tentativas. Aguarde alguns minutos e tente novamente.", 429);
    }

    const { rows } = await query("select id, email, password_hash from users where lower(email) = $1", [email]);
    const user = rows[0];
    // compara sempre (mesmo sem usuário) para não revelar quais e-mails existem
    const ok = await bcrypt.compare(password, user?.password_hash || "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi");
    if (!user || !ok) {
      registerLoginFailure(key);
      return bad(res, "E-mail ou senha incorretos", 401);
    }
    clearLoginFailures(key);
    res.json({ token: signToken(user), user: { id: user.id, email: user.email } });
  })
);

app.get("/api/auth/me", requireAuth, (req, res) => res.json({ user: req.user }));

app.post(
  "/api/auth/forgot",
  wrap(async (req, res) => {
    const email = text(req.body.email).toLowerCase();
    if (email) {
      const { rows } = await query("select id, email from users where lower(email) = $1", [email]);
      if (rows[0]) {
        const token = crypto.randomBytes(32).toString("hex");
        const hash = crypto.createHash("sha256").update(token).digest("hex");
        await query(
          "insert into password_resets (user_id, token_hash, expires_at) values ($1, $2, now() + interval '1 hour')",
          [rows[0].id, hash]
        );
        const link = `${config.appUrl}/?recover=true&token=${token}`;
        try {
          await sendPasswordResetEmail(rows[0].email, link);
        } catch (err) {
          console.error("[mailer] falha ao enviar e-mail:", err.message);
        }
      }
    }
    // Resposta idêntica exista o e-mail ou não (evita enumeração de usuários).
    res.json({ ok: true });
  })
);

app.post(
  "/api/auth/reset",
  wrap(async (req, res) => {
    const token = text(req.body.token);
    const password = typeof req.body.password === "string" ? req.body.password : "";
    if (!token) return bad(res, "Link de recuperação inválido.");
    if (password.length < MIN_PASSWORD) return bad(res, `Senha deve ter pelo menos ${MIN_PASSWORD} caracteres`);

    const hash = crypto.createHash("sha256").update(token).digest("hex");
    const { rows } = await query(
      "select id, user_id from password_resets where token_hash = $1 and used_at is null and expires_at > now()",
      [hash]
    );
    if (!rows[0]) return bad(res, "Link de recuperação inválido ou expirado.", 400);

    const passwordHash = await bcrypt.hash(password, 10);
    await query("update users set password_hash = $1, updated_at = now() where id = $2", [passwordHash, rows[0].user_id]);
    await query("update password_resets set used_at = now() where user_id = $1 and used_at is null", [rows[0].user_id]);
    res.json({ ok: true });
  })
);

app.put(
  "/api/auth/password",
  requireAuth,
  wrap(async (req, res) => {
    const currentPassword = typeof req.body.currentPassword === "string" ? req.body.currentPassword : "";
    const newPassword = typeof req.body.newPassword === "string" ? req.body.newPassword : "";
    if (newPassword.length < MIN_PASSWORD) return bad(res, `Senha deve ter pelo menos ${MIN_PASSWORD} caracteres`);

    const { rows } = await query("select password_hash from users where id = $1", [req.user.id]);
    if (!rows[0] || !(await bcrypt.compare(currentPassword, rows[0].password_hash))) {
      return bad(res, "Senha atual incorreta.", 403);
    }
    await query("update users set password_hash = $1, updated_at = now() where id = $2", [
      await bcrypt.hash(newPassword, 10),
      req.user.id,
    ]);
    res.json({ ok: true });
  })
);

app.put(
  "/api/auth/email",
  requireAuth,
  wrap(async (req, res) => {
    const newEmail = text(req.body.newEmail).toLowerCase();
    const currentPassword = typeof req.body.currentPassword === "string" ? req.body.currentPassword : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return bad(res, "E-mail inválido.");

    const { rows } = await query("select password_hash from users where id = $1", [req.user.id]);
    if (!rows[0] || !(await bcrypt.compare(currentPassword, rows[0].password_hash))) {
      return bad(res, "Senha atual incorreta.", 403);
    }
    const updated = await query("update users set email = $1, updated_at = now() where id = $2 returning id, email", [
      newEmail,
      req.user.id,
    ]);
    const user = updated.rows[0];
    res.json({ token: signToken(user), user });
  })
);

// ---------- Tempo real (SSE) ----------
app.get("/api/events", requireAuth, eventsHandler);

// ---------- Obras ----------
app.get(
  "/api/projects",
  requireAuth,
  wrap(async (_req, res) => {
    const { rows } = await query("select * from projects order by created_at asc");
    res.json(rows);
  })
);

app.post(
  "/api/projects",
  requireAuth,
  wrap(async (req, res) => {
    const name = text(req.body.name);
    if (!name) return bad(res, "Informe o nome da obra.");
    const { rows } = await query("insert into projects (name, closing_period) values ($1, $2) returning *", [
      name,
      normalizePeriod(req.body.closing_period),
    ]);
    res.status(201).json(rows[0]);
  })
);

app.put(
  "/api/projects/:id",
  requireAuth,
  wrap(async (req, res) => {
    const name = text(req.body.name);
    if (!name) return bad(res, "Informe o nome da obra.");
    const { rows } = await query(
      "update projects set name = $1, closing_period = $2 where id = $3 returning *",
      [name, normalizePeriod(req.body.closing_period), req.params.id]
    );
    if (!rows[0]) return bad(res, "Obra não encontrada.", 404);
    res.json(rows[0]);
  })
);

app.delete(
  "/api/projects/:id",
  requireAuth,
  wrap(async (req, res) => {
    await query("delete from projects where id = $1", [req.params.id]);
    res.status(204).end();
  })
);

// ---------- Funcionários ----------
function parseEmployee(body) {
  const employee = {
    name: text(body.name),
    role: text(body.role),
    daily_rate: Number(body.daily_rate),
    project_id: text(body.project_id),
    pix_key: text(body.pix_key),
  };
  if (!employee.name || !employee.role || !employee.project_id || !employee.pix_key) {
    return { error: "Preencha todos os campos obrigatórios do funcionário." };
  }
  if (!Number.isFinite(employee.daily_rate) || employee.daily_rate <= 0) {
    return { error: "O valor da diária deve ser maior que zero." };
  }
  return { employee };
}

app.get(
  "/api/employees",
  requireAuth,
  wrap(async (_req, res) => {
    const { rows } = await query("select * from employees order by created_at asc");
    res.json(rows);
  })
);

app.post(
  "/api/employees",
  requireAuth,
  wrap(async (req, res) => {
    const { employee, error } = parseEmployee(req.body);
    if (error) return bad(res, error);
    const { rows } = await query(
      `insert into employees (name, role, daily_rate, project_id, pix_key)
       values ($1, $2, $3, $4, $5) returning *`,
      [employee.name, employee.role, employee.daily_rate, employee.project_id, employee.pix_key]
    );
    res.status(201).json(rows[0]);
  })
);

app.put(
  "/api/employees/:id",
  requireAuth,
  wrap(async (req, res) => {
    const { employee, error } = parseEmployee(req.body);
    if (error) return bad(res, error);
    const { rows } = await query(
      `update employees set name = $1, role = $2, daily_rate = $3, project_id = $4, pix_key = $5
       where id = $6 returning *`,
      [employee.name, employee.role, employee.daily_rate, employee.project_id, employee.pix_key, req.params.id]
    );
    if (!rows[0]) return bad(res, "Funcionário não encontrado.", 404);
    res.json(rows[0]);
  })
);

app.delete(
  "/api/employees/:id",
  requireAuth,
  wrap(async (req, res) => {
    await query("delete from employees where id = $1", [req.params.id]);
    res.status(204).end();
  })
);

// ---------- Gastos por obra ----------
function parseExpense(body) {
  const expense = {
    project_id: text(body.project_id),
    description: text(body.description),
    category: text(body.category),
    quantity: Number(body.quantity),
    unit_price: Number(body.unit_price),
    spent_at: text(body.spent_at),
    notes: text(body.notes),
    is_settled: body.is_settled,
  };
  const maximumAmount = 9999999999.99;
  const total = expense.quantity * expense.unit_price;
  if (!expense.project_id || !expense.description || !expense.category || !expense.spent_at) {
    return { error: "Preencha obra, produto, categoria e data do gasto." };
  }
  if (
    !Number.isFinite(expense.quantity) ||
    expense.quantity <= 0 ||
    !Number.isFinite(expense.unit_price) ||
    expense.unit_price <= 0 ||
    !Number.isFinite(total) ||
    total > maximumAmount ||
    expense.quantity > maximumAmount ||
    expense.unit_price > maximumAmount
  ) {
    return { error: "Informe quantidade e valor unitário válidos." };
  }
  const parsedDate = new Date(`${expense.spent_at}T00:00:00.000Z`);
  if (
    !DATE_RE.test(expense.spent_at) ||
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== expense.spent_at
  ) {
    return { error: "Informe uma data válida." };
  }
  if (typeof expense.is_settled !== "boolean") {
    return { error: "Informe se o gasto está fechado ou em aberto." };
  }
  expense.total = Number(total.toFixed(2));
  return { expense };
}

app.get(
  "/api/expenses",
  requireAuth,
  wrap(async (_req, res) => {
    const { rows } = await query("select * from project_expenses order by spent_at desc, created_at desc");
    res.json(rows);
  })
);

app.post(
  "/api/expenses",
  requireAuth,
  wrap(async (req, res) => {
    const { expense, error } = parseExpense(req.body);
    if (error) return bad(res, error);
    const { rows } = await query(
      `insert into project_expenses
        (project_id, description, category, quantity, unit_price, total, spent_at, notes, is_settled)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       returning *`,
      [
        expense.project_id,
        expense.description,
        expense.category,
        expense.quantity,
        expense.unit_price,
        expense.total,
        expense.spent_at,
        expense.notes,
        expense.is_settled,
      ]
    );
    res.status(201).json(rows[0]);
  })
);

app.put(
  "/api/expenses/:id",
  requireAuth,
  wrap(async (req, res) => {
    const { expense, error } = parseExpense(req.body);
    if (error) return bad(res, error);
    const { rows } = await query(
      `update project_expenses
       set project_id = $1, description = $2, category = $3, quantity = $4, unit_price = $5,
           total = $6, spent_at = $7, notes = $8, is_settled = $9, updated_at = now()
       where id = $10
       returning *`,
      [
        expense.project_id,
        expense.description,
        expense.category,
        expense.quantity,
        expense.unit_price,
        expense.total,
        expense.spent_at,
        expense.notes,
        expense.is_settled,
        req.params.id,
      ]
    );
    if (!rows[0]) return bad(res, "Gasto não encontrado.", 404);
    res.json(rows[0]);
  })
);

app.delete(
  "/api/expenses/:id",
  requireAuth,
  wrap(async (req, res) => {
    await query("delete from project_expenses where id = $1", [req.params.id]);
    res.status(204).end();
  })
);

// ---------- Frequência ----------
app.get(
  "/api/attendance",
  requireAuth,
  wrap(async (req, res) => {
    const weeks = text(req.query.weeks).split(",").filter(Boolean);
    if (!weeks.length || !weeks.every((week) => DATE_RE.test(week))) {
      return bad(res, "Informe as semanas no formato AAAA-MM-DD, separadas por vírgula.");
    }
    const { rows } = await query("select * from attendance_records where week_start = any($1::date[])", [weeks]);
    res.json(rows);
  })
);

app.put(
  "/api/attendance",
  requireAuth,
  wrap(async (req, res) => {
    const { employee_id: employeeId, week_start: weekStart, day, status } = req.body;
    if (!employeeId || !DATE_RE.test(weekStart || "") || !DAYS.includes(day) || !STATUSES.includes(status)) {
      return bad(res, "Dados de frequência inválidos.");
    }
    const { rows } = await query(
      `insert into attendance_records (employee_id, week_start, day, status, updated_at)
       values ($1, $2, $3, $4, now())
       on conflict (employee_id, week_start, day)
       do update set status = excluded.status, updated_at = now()
       returning *`,
      [employeeId, weekStart, day, status]
    );
    res.json(rows[0]);
  })
);

// ---------- Erros ----------
app.use((req, res) => res.status(404).json({ error: "Rota não encontrada." }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.code === "23505") return bad(res, "Já existe um registro com esses dados.", 409);
  if (err.code === "23503") return bad(res, "Registro relacionado não encontrado.", 400);
  if (err.code === "22P02") return bad(res, "Identificador inválido.", 400);
  console.error("[api] erro:", err);
  res.status(500).json({ error: "Erro interno do servidor." });
});

app.listen(config.port, () => {
  console.log(`[api] rodando na porta ${config.port}`);
  initEvents();
});
