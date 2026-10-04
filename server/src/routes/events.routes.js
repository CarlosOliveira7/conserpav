import { Router } from "express";
import { requireAuth } from "../auth.js";
import { eventsHandler } from "../events.js";

const router = Router();

router.get("/events", requireAuth, eventsHandler);

export default router;
