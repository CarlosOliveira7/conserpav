-- Migração 001: schema baseline (estado inicial pós-migração do Supabase)
-- Idempotente: usa IF NOT EXISTS / CREATE OR REPLACE em todas as instruções.
-- As migrações seguintes (002+) adicionam colunas e constraints incrementalmente.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========== USUÁRIOS (autenticação) ==========
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (lower(email));

-- Tokens de recuperação de senha (guardamos só o hash SHA-256 do token)
CREATE TABLE IF NOT EXISTS password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS password_resets_user_idx ON password_resets (user_id);

-- ========== PROPRIETÁRIO ==========
CREATE TABLE IF NOT EXISTS proprietarios (
  id uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  empresa_nome text NOT NULL DEFAULT 'Administrador',
  telefone text,
  pix_chave text,
  pix_tipo text DEFAULT 'email',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ========== OBRAS ==========
-- owner_id é adicionado na migração 002.
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  -- 'semanal' fecha a cada 1 semana (seg-sáb); 'quinzenal' a cada 2 semanas.
  closing_period text NOT NULL DEFAULT 'quinzenal'
    CHECK (closing_period IN ('semanal', 'quinzenal')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== FUNCIONÁRIOS ==========
-- updated_at é adicionado na migração 003.
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL,
  daily_rate numeric(10, 2) NOT NULL CHECK (daily_rate > 0),
  pix_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS employees_project_id_idx ON employees (project_id);
CREATE UNIQUE INDEX IF NOT EXISTS employees_unique_name_per_project
  ON employees (project_id, lower(name));

-- ========== FREQUÊNCIA (CHAMADA) ==========
-- CHECK de week_start como segunda-feira é adicionado na migração 003.
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees (id) ON DELETE CASCADE,
  week_start date NOT NULL,
  day text NOT NULL CHECK (day IN ('seg', 'ter', 'qua', 'qui', 'sex', 'sab')),
  status text NOT NULL CHECK (status IN ('absent', 'full', 'half')) DEFAULT 'absent',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attendance_unique_slot UNIQUE (employee_id, week_start, day)
);
CREATE INDEX IF NOT EXISTS attendance_week_idx ON attendance_records (week_start);
CREATE INDEX IF NOT EXISTS attendance_employee_idx ON attendance_records (employee_id);

-- ========== GASTOS POR OBRA ==========
CREATE TABLE IF NOT EXISTS project_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  description text NOT NULL,
  category text NOT NULL,
  quantity numeric(12, 2) NOT NULL CHECK (quantity > 0),
  unit_price numeric(12, 2) NOT NULL CHECK (unit_price > 0),
  total numeric(12, 2) NOT NULL CHECK (total >= 0),
  spent_at date NOT NULL,
  notes text NOT NULL DEFAULT '',
  is_settled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS project_expenses_project_idx ON project_expenses (project_id);
CREATE INDEX IF NOT EXISTS project_expenses_date_idx ON project_expenses (spent_at);

-- ========== TEMPO REAL (LISTEN/NOTIFY) ==========
-- Payload ampliado com owner_id na migração 004.
CREATE OR REPLACE FUNCTION notify_table_change() RETURNS trigger AS $$
DECLARE
  payload json;
BEGIN
  payload := json_build_object(
    'table', TG_TABLE_NAME,
    'eventType', TG_OP,
    'new', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW) END,
    'old', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD) END
  );
  PERFORM pg_notify('table_changes', payload::text);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_notify ON projects;
CREATE TRIGGER projects_notify AFTER INSERT OR UPDATE OR DELETE ON projects
  FOR EACH ROW EXECUTE FUNCTION notify_table_change();

DROP TRIGGER IF EXISTS employees_notify ON employees;
CREATE TRIGGER employees_notify AFTER INSERT OR UPDATE OR DELETE ON employees
  FOR EACH ROW EXECUTE FUNCTION notify_table_change();

DROP TRIGGER IF EXISTS attendance_notify ON attendance_records;
CREATE TRIGGER attendance_notify AFTER INSERT OR UPDATE OR DELETE ON attendance_records
  FOR EACH ROW EXECUTE FUNCTION notify_table_change();

DROP TRIGGER IF EXISTS project_expenses_notify ON project_expenses;
CREATE TRIGGER project_expenses_notify AFTER INSERT OR UPDATE OR DELETE ON project_expenses
  FOR EACH ROW EXECUTE FUNCTION notify_table_change();
