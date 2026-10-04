import { z } from "zod";
import { dateStringSchema, uuidSchema } from "./common.schema.js";

const MAX_AMOUNT = 9999999999.99;

export const expenseSchema = z
  .object({
    project_id: uuidSchema,
    description: z
      .string()
      .trim()
      .min(1, { message: "Informe a descrição do gasto." })
      .max(200, { message: "Descrição deve ter no máximo 200 caracteres." }),
    category: z
      .string()
      .trim()
      .min(1, { message: "Informe a categoria do gasto." })
      .max(100, { message: "Categoria deve ter no máximo 100 caracteres." }),
    quantity: z
      .number({ invalid_type_error: "Informe uma quantidade válida." })
      .positive({ message: "Quantidade deve ser maior que zero." })
      .max(MAX_AMOUNT, { message: "Quantidade excede o limite." }),
    unit_price: z
      .number({ invalid_type_error: "Informe um valor unitário válido." })
      .positive({ message: "Valor unitário deve ser maior que zero." })
      .max(MAX_AMOUNT, { message: "Valor unitário excede o limite." }),
    total: z.number().optional(),
    spent_at: dateStringSchema,
    notes: z.string().trim().max(500, { message: "Observações devem ter no máximo 500 caracteres." }).default(""),
    is_settled: z.boolean({ invalid_type_error: "Informe se o gasto está fechado." }),
  })
  .strict();
