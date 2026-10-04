import { query } from "../db.js";
import { AppError } from "../errors/AppError.js";

export async function listProjects(userId) {
  const { rows } = await query(
    "SELECT * FROM projects WHERE owner_id = $1 ORDER BY created_at ASC",
    [userId]
  );
  return rows;
}

export async function createProject(userId, { name, closing_period }) {
  const { rows } = await query(
    `INSERT INTO projects (owner_id, name, closing_period)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, name, closing_period]
  );
  return rows[0];
}

export async function updateProject(userId, id, { name, closing_period }) {
  const { rows } = await query(
    `UPDATE projects
        SET name = $1, closing_period = $2, updated_at = now()
      WHERE id = $3 AND owner_id = $4
     RETURNING *`,
    [name, closing_period, id, userId]
  );
  if (!rows[0]) {
    throw new AppError(404, "PROJECT_NOT_FOUND", "Obra não encontrada.");
  }
  return rows[0];
}

export async function deleteProject(userId, id) {
  const { rowCount } = await query(
    "DELETE FROM projects WHERE id = $1 AND owner_id = $2",
    [id, userId]
  );
  if (rowCount === 0) {
    throw new AppError(404, "PROJECT_NOT_FOUND", "Obra não encontrada.");
  }
}
