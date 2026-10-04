import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { errorHandler } from "./middleware/errorHandler.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import authRoutes from "./routes/auth.routes.js";
import employeesRoutes from "./routes/employees.routes.js";
import eventsRoutes from "./routes/events.routes.js";
import expensesRoutes from "./routes/expenses.routes.js";
import healthRoutes from "./routes/health.routes.js";
import projectsRoutes from "./routes/projects.routes.js";

const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origem não permitida pelo CORS"));
    },
  })
);

app.use(express.json({ limit: "10kb" }));

// Routes
app.use("/api", healthRoutes);
app.use("/api", authRoutes);
app.use("/api", eventsRoutes);
app.use("/api", projectsRoutes);
app.use("/api", employeesRoutes);
app.use("/api", expensesRoutes);
app.use("/api", attendanceRoutes);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "Rota não encontrada.",
    },
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
