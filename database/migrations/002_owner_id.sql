-- Migração 002: adiciona owner_id em projects e unicidade por dono

ALTER TABLE projects ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES users (id) ON DELETE CASCADE;

-- Atribui ao primeiro usuário existente caso haja registros sem dono
UPDATE projects 
SET owner_id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1)
WHERE owner_id IS NULL;

-- Garante NOT NULL
ALTER TABLE projects ALTER COLUMN owner_id SET NOT NULL;

-- Unicidade do nome da obra passa a ser POR proprietário
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_name_unique;
DROP INDEX IF EXISTS projects_owner_name_unique;
CREATE UNIQUE INDEX IF NOT EXISTS projects_owner_name_unique ON projects (owner_id, lower(name));

-- Índice por owner_id
CREATE INDEX IF NOT EXISTS projects_owner_id_idx ON projects (owner_id);
