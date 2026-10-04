import { query } from "../db.js";
import { AppError } from "../errors/AppError.js";

export async function getAttendanceForWeeks(userId, weeks) {
  const { rows } = await query(
    `SELECT a.*
       FROM attendance_records a
       JOIN employees e ON e.id = a.employee_id
       JOIN projects p ON p.id = e.project_id
      WHERE p.owner_id = $1 AND a.week_start = ANY($2::date[])`,
    [userId, weeks]
  );
  return rows;
}

export async function upsertAttendance(userId, { employee_id, week_start, day, status }) {
  // Verify employee belongs to a project owned by userId
  const { rows: empRows } = await query(
    `SELECT e.id
       FROM employees e
       JOIN projects p ON p.id = e.project_id
      WHERE e.id = $1 AND p.owner_id = $2`,
    [employee_id, userId]
  );

  if (!empRows[0]) {
    throw new AppError(404, "EMPLOYEE_NOT_FOUND", "Funcionário não encontrado.");
  }

  const { rows } = await query(
    `INSERT INTO attendance_records (employee_id, week_start, day, status, updated_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (employee_id, week_start, day)
     DO UPDATE SET status = EXCLUDED.status, updated_at = now()
     RETURNING *`,
    [employee_id, week_start, day, status]
  );
  return rows[0];
}
