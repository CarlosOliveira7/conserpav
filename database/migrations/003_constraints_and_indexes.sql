-- Migração 003: constraints e índices adicionais

-- Garante que week_start seja uma segunda-feira (ISO 1 = Monday)
ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_week_start_monday_check;
ALTER TABLE attendance_records ADD CONSTRAINT attendance_week_start_monday_check
  CHECK (EXTRACT(ISODOW FROM week_start) = 1);

-- Índice composto para consultas por funcionário e semana
CREATE INDEX IF NOT EXISTS attendance_employee_week_idx ON attendance_records (employee_id, week_start);

-- Adiciona updated_at em employees e projects
ALTER TABLE employees ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_employees_updated_at ON employees;
CREATE TRIGGER set_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS set_projects_updated_at ON projects;
CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp_column();
