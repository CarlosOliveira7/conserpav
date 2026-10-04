import { z } from "zod";

export const projectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { message: "O nome da obra deve ter pelo menos 2 caracteres." })
      .max(100, { message: "O nome da obra deve ter no máximo 100 caracteres." }),
    closing_period: z.enum(["semanal", "quinzenal"]).default("quinzenal"),
  })
  .strict();
