import { config } from "../config.js";
import { AppError } from "../errors/AppError.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function csrfProtection(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // Require custom header for state-changing requests when using cookies
  const customHeader = req.headers["x-requested-with"] || req.headers["x-csrf-token"];
  if (!customHeader) {
    return next(new AppError(403, "CSRF_PROTECTION", "Cabeçalho CSRF ausente ou inválido."));
  }

  // Verify origin if present
  const origin = req.headers.origin || req.headers.referer;
  if (origin) {
    const originUrl = new URL(origin).origin;
    if (!config.corsOrigins.includes(originUrl)) {
      return next(new AppError(403, "CSRF_PROTECTION", "Origem não permitida pela proteção CSRF."));
    }
  }

  next();
}
