import nodemailer from "nodemailer";
import { config } from "./config.js";
import { logger } from "./logger.js";

const transporter = config.smtp.host
  ? nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    })
  : null;

function maskEmail(email) {
  if (!email || !email.includes("@")) return "***";
  const [name, domain] = email.split("@");
  return `${name[0]}***@${domain}`;
}

export async function sendPasswordResetEmail(to, link) {
  if (!transporter) {
    logger.info(`[mailer] SMTP não configurado. Link de recuperação gerado para ${maskEmail(to)}:\n  ${link}`);
    return;
  }
  await transporter.sendMail({
    from: config.smtp.from,
    to,
    subject: "Recuperação de senha — Controle de Frequência",
    text: `Para criar uma nova senha, acesse o link abaixo (válido por 1 hora):\n\n${link}\n\nSe você não pediu isso, ignore este e-mail.`,
  });
}
