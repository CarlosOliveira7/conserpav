-- Controle de Frequência de Obras — schema do banco (PostgreSQL puro)
-- Pode ser executado várias vezes com segurança (idempotente).
-- Uso:  npm run db:migrate   (dentro de /server)   ou   psql "$DATABASE_URL" -f database/schema.sql
--
-- Diferenças em relação à versão Supabase:
--  * auth.users foi substituída pela tabela "users" (e-mail + hash bcrypt da senha);
--  * RLS foi removido: o navegador não fala mais com o banco, só a API (que exige JWT);
--  * Realtime (publication supabase_realtime) foi substituído por triggers que
--    disparam NOTIFY; a API escuta o canal e repassa por Server-Sent Events.

create extension if not exists "pgcrypto";

-- ========== USUÁRIOS (autenticação) ==========
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists users_email_unique on users (lower(email));

-- Tokens de recuperação de senha (guardamos só o hash SHA-256 do token)
create table if not exists password_resets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists password_resets_user_idx on password_resets (user_id);

-- ========== PROPRIETÁRIO ==========
create table if not exists proprietarios (
  id uuid primary key references users (id) on delete cascade,
  empresa_nome text not null default 'Administrador',
  telefone text,
  pix_chave text,
  pix_tipo text default 'email',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========== OBRAS ==========
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- 'semanal' fecha a cada 1 semana (6 dias, seg-sáb); 'quinzenal' a cada 2 semanas (12 dias).
  closing_period text not null default 'quinzenal'
    check (closing_period in ('semanal', 'quinzenal')),
  created_at timestamptz not null default now(),
  constraint projects_name_unique unique (name)
);

-- ========== FUNCIONÁRIOS ==========
create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  name text not null,
  role text not null,
  daily_rate numeric(10, 2) not null check (daily_rate > 0),
  pix_key text not null,
  created_at timestamptz not null default now()
);
create index if not exists employees_project_id_idx on employees (project_id);
create unique index if not exists employees_unique_name_per_project
  on employees (project_id, lower(name));

-- ========== FREQUÊNCIA (CHAMADA) ==========
-- week_start é sempre a segunda-feira (ISO) da semana da marcação.
create table if not exists attendance_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees (id) on delete cascade,
  week_start date not null,
  day text not null check (day in ('seg', 'ter', 'qua', 'qui', 'sex', 'sab')),
  status text not null check (status in ('absent', 'full', 'half')) default 'absent',
  updated_at timestamptz not null default now(),
  constraint attendance_unique_slot unique (employee_id, week_start, day)
);
create index if not exists attendance_week_idx on attendance_records (week_start);
create index if not exists attendance_employee_idx on attendance_records (employee_id);

-- ========== GASTOS POR OBRA ==========
create table if not exists project_expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  description text not null,
  category text not null,
  quantity numeric(12, 2) not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price > 0),
  total numeric(12, 2) not null check (total >= 0),
  spent_at date not null,
  notes text not null default '',
  is_settled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists project_expenses_project_idx on project_expenses (project_id);
create index if not exists project_expenses_date_idx on project_expenses (spent_at);

-- ========== TEMPO REAL (LISTEN/NOTIFY) ==========
-- Cada INSERT/UPDATE/DELETE publica um JSON no canal "table_changes".
-- A API (server/src/events.js) escuta esse canal e envia aos navegadores via SSE.
create or replace function notify_table_change() returns trigger as $$
declare
  payload json;
begin
  payload := json_build_object(
    'table', TG_TABLE_NAME,
    'eventType', TG_OP,
    'new', case when TG_OP = 'DELETE' then null else row_to_json(NEW) end,
    'old', case when TG_OP = 'INSERT' then null else row_to_json(OLD) end
  );
  perform pg_notify('table_changes', payload::text);
  return null;
end;
$$ language plpgsql;

drop trigger if exists projects_notify on projects;
create trigger projects_notify after insert or update or delete on projects
  for each row execute function notify_table_change();

drop trigger if exists employees_notify on employees;
create trigger employees_notify after insert or update or delete on employees
  for each row execute function notify_table_change();

drop trigger if exists attendance_notify on attendance_records;
create trigger attendance_notify after insert or update or delete on attendance_records
  for each row execute function notify_table_change();

drop trigger if exists project_expenses_notify on project_expenses;
create trigger project_expenses_notify after insert or update or delete on project_expenses
  for each row execute function notify_table_change();
