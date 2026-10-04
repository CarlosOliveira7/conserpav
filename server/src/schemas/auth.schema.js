import { z } from "zod";

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email({ message: "E-mail inválido." }),
    password: z.string().min(1, { message: "Informe a senha." }),
  })
  .strict();

export const forgotPasswordSchema = z
  .object({
    email: z.string().trim().toLowerCase().email({ message: "E-mail inválido." }),
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, { message: "Token de recuperação é obrigatório." }),
    password: z.string().min(8, { message: "Senha deve ter pelo menos 8 caracteres." }),
  })
  .strict();

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "Informe a senha atual." }),
    newPassword: z.string().min(8, { message: "Nova senha deve ter pelo menos 8 caracteres." }),
  })
  .strict();

export const updateEmailSchema = z
  .object({
    newEmail: z.string().trim().toLowerCase().email({ message: "Novo e-mail inválido." }),
    currentPassword: z.string().min(1, { message: "Informe a senha atual." }),
  })
  .strict();
