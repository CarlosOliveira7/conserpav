-- Migração 004: Triggers de NOTIFY com payload seguro e owner_id

CREATE OR REPLACE FUNCTION notify_table_change() RETURNS trigger AS $$
DECLARE
  payload json;
  row_data record;
  owner_uuid uuid;
  new_clean json;
  old_clean json;
BEGIN
  row_data := CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;

  -- Identifica o owner_id da alteração
  IF TG_TABLE_NAME = 'projects' THEN
    owner_uuid := row_data.owner_id;
  ELSIF TG_TABLE_NAME = 'employees' THEN
    SELECT owner_id INTO owner_uuid FROM projects WHERE id = row_data.project_id;
  ELSIF TG_TABLE_NAME = 'project_expenses' THEN
    SELECT owner_id INTO owner_uuid FROM projects WHERE id = row_data.project_id;
  ELSIF TG_TABLE_NAME = 'attendance_records' THEN
    SELECT p.owner_id INTO owner_uuid 
      FROM employees e 
      JOIN projects p ON p.id = e.project_id 
     WHERE e.id = row_data.employee_id;
  END IF;

  -- Omitir dados sensíveis (pix_key) nas notificações de employees
  IF TG_TABLE_NAME = 'employees' THEN
    IF NEW IS NOT NULL THEN
      new_clean := json_build_object(
        'id', NEW.id,
        'project_id', NEW.project_id,
        'name', NEW.name,
        'role', NEW.role,
        'daily_rate', NEW.daily_rate,
        'created_at', NEW.created_at,
        'updated_at', NEW.updated_at
      );
    END IF;
    IF OLD IS NOT NULL THEN
      old_clean := json_build_object(
        'id', OLD.id,
        'project_id', OLD.project_id,
        'name', OLD.name,
        'role', OLD.role,
        'daily_rate', OLD.daily_rate,
        'created_at', OLD.created_at,
        'updated_at', OLD.updated_at
      );
    END IF;
  ELSE
    new_clean := CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW) END;
    old_clean := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD) END;
  END IF;

  payload := json_build_object(
    'table', TG_TABLE_NAME,
    'eventType', TG_OP,
    'owner_id', owner_uuid,
    'new', new_clean,
    'old', old_clean
  );

  PERFORM pg_notify('table_changes', payload::text);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
