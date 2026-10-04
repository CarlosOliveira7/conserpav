import { query } from "../db.js";
import { AppError } from "../errors/AppError.js";

export async function listExpenses(userId) {
  const { rows } = await query(
    `SELECT ex.*
       FROM project_expenses ex
       JOIN projects p ON p.id = ex.project_id
      WHERE p.owner_id = $1
   ORDER BY ex.spent_at DESC, ex.created_at DESC`,
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

export async function createExpense(userId, data) {
  await verifyProjectOwner(userId, data.project_id);
  const total = Number((data.quantity * data.unit_price).toFixed(2));

  const { rows } = await query(
    `INSERT INTO project_expenses
        (project_id, description, category, quantity, unit_price, total, spent_at, notes, is_settled)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      data.project_id,
      data.description,
      data.category,
      data.quantity,
      data.unit_price,
      total,
      data.spent_at,
      data.notes,
      data.is_settled,
    ]
  );
  return rows[0];
}

export async function updateExpense(userId, id, data) {
  await verifyProjectOwner(userId, data.project_id);
  const total = Number((data.quantity * data.unit_price).toFixed(2));

  const { rows } = await query(
    `UPDATE project_expenses ex
        SET project_id = $1, description = $2, category = $3, quantity = $4, unit_price = $5,
            total = $6, spent_at = $7, notes = $8, is_settled = $9, updated_at = now()
       FROM projects p
      WHERE ex.id = $10 AND ex.project_id = p.id AND p.owner_id = $11
     RETURNING ex.*`,
    [
      data.project_id,
      data.description,
      data.category,
      data.quantity,
      data.unit_price,
      total,
      data.spent_at,
      data.notes,
      data.is_settled,
      id,
      userId,
    ]
  );
  if (!rows[0]) {
    throw new AppError(404, "EXPENSE_NOT_FOUND", "Gasto não encontrado.");
  }
  return rows[0];
}

export async function deleteExpense(userId, id) {
  const { rowCount } = await query(
    `DELETE FROM project_expenses ex
      USING projects p
      WHERE ex.id = $1 AND ex.project_id = p.id AND p.owner_id = $2`,
    [id, userId]
  );
  if (rowCount === 0) {
    throw new AppError(404, "EXPENSE_NOT_FOUND", "Gasto não encontrado.");
  }
}
