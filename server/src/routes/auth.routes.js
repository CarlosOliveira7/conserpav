import { Router } from "express";
import { clearAuthCookie, requireAuth, setAuthCookie } from "../auth.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  updateEmailSchema,
  updatePasswordSchema,
} from "../schemas/auth.schema.js";
import {
  loginUser,
  requestPasswordReset,
  resetPasswordWithToken,
  updateEmail,
  updatePassword,
} from "../services/auth.service.js";

const router = Router();

router.post("/login", authLimiter, validate({ body: loginSchema }), async (req, res, next) => {
  try {
    const result = await loginUser(req.body.email, req.body.password);
    setAuthCookie(res, result.token);
    res.json({ user: result.user, token: result.token });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.post("/forgot", authLimiter, validate({ body: forgotPasswordSchema }), async (req, res, next) => {
  try {
    const result = await requestPasswordReset(req.body.email);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/reset", authLimiter, validate({ body: resetPasswordSchema }), async (req, res, next) => {
  try {
    const result = await resetPasswordWithToken(req.body.token, req.body.password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.put(
  "/password",
  requireAuth,
  authLimiter,
  validate({ body: updatePasswordSchema }),
  async (req, res, next) => {
    try {
      const result = await updatePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/email",
  requireAuth,
  authLimiter,
  validate({ body: updateEmailSchema }),
  async (req, res, next) => {
    try {
      const result = await updateEmail(req.user.id, req.body.newEmail, req.body.currentPassword);
      setAuthCookie(res, result.token);
      res.json({ user: result.user, token: result.token });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
