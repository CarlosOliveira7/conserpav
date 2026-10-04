import { Router } from "express";
import { requireAuth } from "../auth.js";
import { validate } from "../middleware/validate.js";
import {
  getAttendanceQuerySchema,
  upsertAttendanceSchema,
} from "../schemas/attendance.schema.js";
import {
  getAttendanceForWeeks,
  upsertAttendance,
} from "../services/attendance.service.js";

const router = Router();

router.use(requireAuth);

router.get("/", validate({ query: getAttendanceQuerySchema }), async (req, res, next) => {
  try {
    const records = await getAttendanceForWeeks(req.user.id, req.query.weeks);
    res.json(records);
  } catch (err) {
    next(err);
  }
});

router.put("/", validate({ body: upsertAttendanceSchema }), async (req, res, next) => {
  try {
    const record = await upsertAttendance(req.user.id, req.body);
    res.json(record);
  } catch (err) {
    next(err);
  }
});

export default router;
