import { z } from "zod";
import { uuidSchema } from "./common.schema.js";

export const employeeSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { message: "O nome do funcionário deve ter pelo menos 2 caracteres." })
      .max(100, { message: "O nome do funcionário deve ter no máximo 100 caracteres." }),
    role: z
      .string()
      .trim()
      .min(2, { message: "A função deve ter pelo menos 2 caracteres." })
      .max(100, { message: "A função deve ter no máximo 100 caracteres." }),
    daily_rate: z
      .number({ invalid_type_error: "O valor da diária deve ser um número." })
      .positive({ message: "O valor da diária deve ser maior que zero." })
      .max(999999.99, { message: "O valor da diária excede o limite máximo." }),
    project_id: uuidSchema,
    pix_key: z
      .string()
      .trim()
      .min(1, { message: "A chave Pix é obrigatória." })
      .max(150, { message: "A chave Pix deve ter no máximo 150 caracteres." }),
  })
  .strict();
