import { z } from "zod";

export const uuidSchema = z.string().uuid({ message: "UUID inválido." });

export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Formato de data inválido (esperado AAAA-MM-DD)." })
  .refine((val) => !isNaN(Date.parse(`${val}T00:00:00.000Z`)), { message: "Data inválida." });

export const mondayDateSchema = dateStringSchema.refine((val) => {
  const date = new Date(`${val}T00:00:00.000Z`);
  return date.getUTCDay() === 1;
}, { message: "A data deve ser uma segunda-feira." });

export const idParamSchema = z.object({
  id: uuidSchema,
}).strict();
