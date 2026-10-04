import { Router } from "express";
import { requireAuth } from "../auth.js";
import { validate } from "../middleware/validate.js";
import { getReportQuerySchema } from "../schemas/reports.schema.js";
import { generateReport } from "../services/reports.service.js";

const router = Router();

router.use(requireAuth);

router.get("/", validate({ query: getReportQuerySchema }), async (req, res, next) => {
  try {
    const reportData = await generateReport(req.user.id, {
      project_id: req.query.project_id,
      weeks: req.query.weeks,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
    });
    res.json(reportData);
  } catch (err) {
    next(err);
  }
});

export default router;
