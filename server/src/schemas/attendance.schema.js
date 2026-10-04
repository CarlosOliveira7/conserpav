import { z } from "zod";
import { mondayDateSchema, uuidSchema } from "./common.schema.js";

const DAYS = ["seg", "ter", "qua", "qui", "sex", "sab"];
const STATUSES = ["absent", "full", "half"];

export const getAttendanceQuerySchema = z
  .object({
    weeks: z
      .string()
      .trim()
      .min(1, { message: "Informe as semanas." })
      .transform((val) => val.split(",").map((w) => w.trim()).filter(Boolean))
      .refine((arr) => arr.length > 0 && arr.length <= 4, {
        message: "Informe de 1 a no máximo 4 semanas por requisição.",
      })
      .refine(
        (arr) =>
          arr.every((dateStr) => {
            const date = new Date(`${dateStr}T00:00:00.000Z`);
            return (
              /^\d{4}-\d{2}-\d{2}$/.test(dateStr) &&
              !isNaN(date.getTime()) &&
              date.getUTCDay() === 1
            );
          }),
        { message: "Cada semana deve ser uma data válida AAAA-MM-DD e ser uma segunda-feira." }
      ),
  })
  .strip();

export const upsertAttendanceSchema = z
  .object({
    employee_id: uuidSchema,
    week_start: mondayDateSchema,
    day: z.enum(DAYS, { errorMap: () => ({ message: "Dia da semana inválido (esperado seg, ter, qua, qui, sex, sab)." }) }),
    status: z.enum(STATUSES, { errorMap: () => ({ message: "Status inválido (esperado absent, full, half)." }) }),
  })
  .strict();
