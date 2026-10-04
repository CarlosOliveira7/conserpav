import { Router } from "express";
import { requireAuth } from "../auth.js";
import { validate } from "../middleware/validate.js";
import { idParamSchema } from "../schemas/common.schema.js";
import { projectSchema } from "../schemas/projects.schema.js";
import {
  createProject,
  deleteProject,
  listProjects,
  updateProject,
} from "../services/projects.service.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const projects = await listProjects(req.user.id);
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

router.post("/", validate({ body: projectSchema }), async (req, res, next) => {
  try {
    const project = await createProject(req.user.id, req.body);
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

router.put(
  "/:id",
  validate({ params: idParamSchema, body: projectSchema }),
  async (req, res, next) => {
    try {
      const project = await updateProject(req.user.id, req.params.id, req.body);
      res.json(project);
    } catch (err) {
      next(err);
    }
  }
);

router.delete("/:id", validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    await deleteProject(req.user.id, req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
