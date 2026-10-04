import { Router } from "express";
import { requireAuth } from "../auth.js";
import { validate } from "../middleware/validate.js";
import { idParamSchema } from "../schemas/common.schema.js";
import { employeeSchema } from "../schemas/employees.schema.js";
import {
  createEmployee,
  deleteEmployee,
  listEmployees,
  updateEmployee,
} from "../services/employees.service.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const employees = await listEmployees(req.user.id);
    res.json(employees);
  } catch (err) {
    next(err);
  }
});

router.post("/", validate({ body: employeeSchema }), async (req, res, next) => {
  try {
    const employee = await createEmployee(req.user.id, req.body);
    res.status(201).json(employee);
  } catch (err) {
    next(err);
  }
});

router.put(
  "/:id",
  validate({ params: idParamSchema, body: employeeSchema }),
  async (req, res, next) => {
    try {
      const employee = await updateEmployee(req.user.id, req.params.id, req.body);
      res.json(employee);
    } catch (err) {
      next(err);
    }
  }
);

router.delete("/:id", validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    await deleteEmployee(req.user.id, req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
