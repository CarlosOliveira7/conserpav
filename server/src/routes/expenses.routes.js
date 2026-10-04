import { Router } from "express";
import { requireAuth } from "../auth.js";
import { validate } from "../middleware/validate.js";
import { idParamSchema } from "../schemas/common.schema.js";
import { expenseSchema } from "../schemas/expenses.schema.js";
import {
  createExpense,
  deleteExpense,
  listExpenses,
  updateExpense,
} from "../services/expenses.service.js";

const router = Router();

router.use(requireAuth);

router.get("/expenses", async (req, res, next) => {
  try {
    const expenses = await listExpenses(req.user.id);
    res.json(expenses);
  } catch (err) {
    next(err);
  }
});

router.post("/expenses", validate({ body: expenseSchema }), async (req, res, next) => {
  try {
    const expense = await createExpense(req.user.id, req.body);
    res.status(201).json(expense);
  } catch (err) {
    next(err);
  }
});

router.put(
  "/expenses/:id",
  validate({ params: idParamSchema, body: expenseSchema }),
  async (req, res, next) => {
    try {
      const expense = await updateExpense(req.user.id, req.params.id, req.body);
      res.json(expense);
    } catch (err) {
      next(err);
    }
  }
);

router.delete("/expenses/:id", validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    await deleteExpense(req.user.id, req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
