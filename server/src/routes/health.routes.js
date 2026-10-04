import { Router } from "express";
import { query } from "../db.js";

const router = Router();

router.get("/health", async (_req, res, next) => {
  try {
    await query("SELECT 1");
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
