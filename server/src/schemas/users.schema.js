import { z } from "zod";

export const createUserSchema = z
  .object({
    email: z
      .string({ required_error: "Informe o e-mail." })
      .trim()
      .toLowerCase()
      .min(1, { message: "Informe o e-mail." })
      .email({ message: "E-mail inválido." }),
    password: z
      .string({ required_error: "Informe a senha." })
      .min(8, { message: "A senha deve ter pelo menos 8 caracteres." }),
  })
  .strict();
