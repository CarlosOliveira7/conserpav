import { z } from "zod";
import { dateStringSchema, mondayDateSchema, uuidSchema } from "./common.schema.js";

export const getReportQuerySchema = z
  .object({
    project_id: uuidSchema,
    weeks: z
      .string()
      .trim()
      .min(1, { message: "Informe as semanas." })
      .transform((val) => val.split(",").map((w) => w.trim()).filter(Boolean))
      .refine((arr) => arr.length > 0 && arr.length <= 4, {
        message: "Informe de 1 a no máximo 4 semanas.",
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
        { message: "Cada semana deve ser uma segunda-feira válida no formato AAAA-MM-DD." }
      ),
    start_date: mondayDateSchema.optional(),
    end_date: dateStringSchema.optional(),
  })
  .strip();
