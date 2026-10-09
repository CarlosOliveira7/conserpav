import jwt from "jsonwebtoken";
import { config } from "./config.js";

export const COOKIE_NAME = "auth_token";

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, {
    algorithm: "HS256",
    expiresIn: config.jwtExpiresIn,
  });
}

export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, config.cookieOptions);
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, config.cookieOptions);
}

/** Middleware: exige cookie httpOnly ou "Authorization: Bearer <jwt>" e preenche req.user. */
export function requireAuth(req, res, next) {
  const cookieToken = req.cookies?.[COOKIE_NAME];
  const header = req.headers.authorization || "";
  const bearerToken = header.startsWith("Bearer ") ? header.slice(7) : null;
  const token = cookieToken || bearerToken;

  if (!token) {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Não autenticado.",
      },
    });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] });
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Sessão expirada. Faça login novamente.",
      },
    });
  }
}
