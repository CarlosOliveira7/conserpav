import { query } from "../db.js";
import { AppError } from "../errors/AppError.js";

function getWorkingDates(startISO, endISO) {
  const dates = [];
  const [year, month, day] = startISO.split("-").map(Number);
  const cursor = new Date(Date.UTC(year, month - 1, day));
  const endTimestamp = Date.parse(`${endISO}T00:00:00.000Z`);

  while (cursor.getTime() <= endTimestamp) {
    if (cursor.getUTCDay() !== 0) {
      const y = cursor.getUTCFullYear();
      const m = String(cursor.getUTCMonth() + 1).padStart(2, "0");
      const d = String(cursor.getUTCDate()).padStart(2, "0");
      dates.push(`${y}-${m}-${d}`);
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function getAttendanceSlot(dateISO) {
  const [year, month, day] = dateISO.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay();
  const dayKeys = { 1: "seg", 2: "ter", 3: "qua", 4: "qui", 5: "sex", 6: "sab" };

  const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
  const monday = new Date(date);
  monday.setUTCDate(monday.getUTCDate() + diffToMonday);
  const y = monday.getUTCFullYear();
  const m = String(monday.getUTCMonth() + 1).padStart(2, "0");
  const d = String(monday.getUTCDate()).padStart(2, "0");

  return { weekStart: `${y}-${m}-${d}`, day: dayKeys[weekday] || null };
}

export async function generateReport(userId, { project_id, weeks, start_date, end_date }) {
  const { rows: projRows } = await query(
    "SELECT id, name, closing_period FROM projects WHERE id = $1 AND owner_id = $2",
    [project_id, userId]
  );
  if (!projRows[0]) {
    throw new AppError(404, "PROJECT_NOT_FOUND", "Obra não encontrada.");
  }

  const { rows: employees } = await query(
    "SELECT id, name, role, daily_rate, pix_key FROM employees WHERE project_id = $1 ORDER BY name ASC",
    [project_id]
  );

  const { rows: attendanceRecords } = await query(
    `SELECT a.employee_id, a.week_start::text, a.day, a.status
       FROM attendance_records a
       JOIN employees e ON e.id = a.employee_id
      WHERE e.project_id = $1 AND a.week_start = ANY($2::date[])`,
    [project_id, weeks]
  );

  const attendanceMap = new Map();
  for (const rec of attendanceRecords) {
    attendanceMap.set(`${rec.employee_id}::${rec.week_start}::${rec.day}`, rec.status);
  }

  const startDateCalculated = start_date || weeks[0];
  const lastWeekStart = weeks[weeks.length - 1];
  const lastDate = new Date(`${lastWeekStart}T00:00:00.000Z`);
  lastDate.setUTCDate(lastDate.getUTCDate() + 5);
  const defaultEndDateStr = `${lastDate.getUTCFullYear()}-${String(lastDate.getUTCMonth() + 1).padStart(2, "0")}-${String(lastDate.getUTCDate()).padStart(2, "0")}`;
  const endDateCalculated = end_date || defaultEndDateStr;

  const workingDates = getWorkingDates(startDateCalculated, endDateCalculated);

  let grandTotalCents = 0;

  const rows = employees.map((emp) => {
    const dailyRateCents = Math.round(Number(emp.daily_rate) * 100);
    const halfRateCents = Math.round(dailyRateCents / 2);

    let full = 0;
    let half = 0;
    let absent = 0;

    for (const dateISO of workingDates) {
      const { weekStart, day } = getAttendanceSlot(dateISO);
      const status = attendanceMap.get(`${emp.id}::${weekStart}::${day}`) || "absent";
      if (status === "full") full += 1;
      else if (status === "half") half += 1;
      else absent += 1;
    }

    const employeeTotalCents = (full * dailyRateCents) + (half * halfRateCents);
    grandTotalCents += employeeTotalCents;

    return {
      employee: {
        id: emp.id,
        name: emp.name,
        role: emp.role,
        daily_rate: Number(emp.daily_rate),
        pix_key: emp.pix_key,
      },
      full,
      half,
      absent,
      total: Number((employeeTotalCents / 100).toFixed(2)),
    };
  });

  return {
    project: projRows[0],
    period: {
      start_date: startDateCalculated,
      end_date: endDateCalculated,
    },
    total_consolidado: Number((grandTotalCents / 100).toFixed(2)),
    rows,
  };
}
