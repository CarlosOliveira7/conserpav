import { query } from "../db.js";
import { AppError } from "../errors/AppError.js";

export async function listEmployees(userId) {
  const { rows } = await query(
    `SELECT e.*
       FROM employees e
       JOIN projects p ON p.id = e.project_id
      WHERE p.owner_id = $1
   ORDER BY e.created_at ASC`,
    [userId]
  );
  return rows;
}

async function verifyProjectOwner(userId, projectId) {
  const { rows } = await query(
    "SELECT id FROM projects WHERE id = $1 AND owner_id = $2",
    [projectId, userId]
  );
  if (!rows[0]) {
    throw new AppError(404, "PROJECT_NOT_FOUND", "Obra não encontrada.");
  }
}

export async function createEmployee(userId, data) {
  await verifyProjectOwner(userId, data.project_id);

  const { rows } = await query(
    `INSERT INTO employees (name, role, daily_rate, project_id, pix_key)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.name, data.role, data.daily_rate, data.project_id, data.pix_key]
  );
  return rows[0];
}

export async function updateEmployee(userId, id, data) {
  await verifyProjectOwner(userId, data.project_id);

  const { rows } = await query(
    `UPDATE employees e
        SET name = $1, role = $2, daily_rate = $3, project_id = $4, pix_key = $5, updated_at = now()
       FROM projects p
      WHERE e.id = $6
        AND e.project_id = p.id
        AND p.owner_id = $7
     RETURNING e.*`,
    [data.name, data.role, data.daily_rate, data.project_id, data.pix_key, id, userId]
  );
  if (!rows[0]) {
    throw new AppError(404, "EMPLOYEE_NOT_FOUND", "Funcionário não encontrado.");
  }
  return rows[0];
}

export async function deleteEmployee(userId, id) {
  const { rowCount } = await query(
    `DELETE FROM employees e
      USING projects p
      WHERE e.id = $1 AND e.project_id = p.id AND p.owner_id = $2`,
    [id, userId]
  );
  if (rowCount === 0) {
    throw new AppError(404, "EMPLOYEE_NOT_FOUND", "Funcionário não encontrado.");
  }
}
