import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { getAuthCookieOptions } from "./cookies.js";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../.env") });
dotenv.config();

const isTest = process.env.NODE_ENV === "test";

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) {
    if (isTest) {
      if (name === "DATABASE_URL") return "postgres://postgres:postgres@localhost:5432/test";
      if (name === "JWT_SECRET") return "test-secret-at-least-32-bytes-long-for-testing-purposes!!";
    }
    console.error(`[config] Variável de ambiente obrigatória ausente: ${name}`);
    process.exit(1);
  }
  return value;
};

const jwtSecret = required("JWT_SECRET");
if (jwtSecret.length < 32) {
  console.error("[config] JWT_SECRET deve ter pelo menos 32 caracteres.");
  process.exit(1);
}

export function parseCorsOrigins(value) {
  return (value || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT || 3001),
  databaseUrl: required("DATABASE_URL"),
  databaseSsl: process.env.DATABASE_SSL === "true",
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN),
  cookieOptions: getAuthCookieOptions(process.env),
  appUrl: (process.env.APP_URL || "http://localhost:5173").replace(/\/$/, ""),
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "no-reply@localhost",
  },
};

if (!["lax", "strict", "none"].includes(config.cookieOptions.sameSite)) {
  console.error("[config] COOKIE_SAMESITE deve ser lax, strict ou none.");
  process.exit(1);
}

