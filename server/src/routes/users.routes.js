import { Router } from "express";
import { authLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { createUserSchema } from "../schemas/users.schema.js";
import { createUser } from "../services/users.service.js";

const router = Router();

router.post("/", authLimiter, validate({ body: createUserSchema }, { errorCode: "INVALID_INPUT" }), async (req, res, next) => {
  try {
    const user = await createUser({
      email: req.body.email,
      password: req.body.password,
    });
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
});

export default router;
