import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./config.js";
import { csrfProtection } from "./middleware/csrf.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { globalLimiter } from "./middleware/rateLimit.js";
import { logger } from "./logger.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import authRoutes from "./routes/auth.routes.js";
import employeesRoutes from "./routes/employees.routes.js";
import eventsRoutes from "./routes/events.routes.js";
import expensesRoutes from "./routes/expenses.routes.js";
import healthRoutes from "./routes/health.routes.js";
import projectsRoutes from "./routes/projects.routes.js";
import reportsRoutes from "./routes/reports.routes.js";

const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");

// Security Headers with Helmet
app.use(helmet());

// CORS with credentials support
app.use(
  (req, res, next) => {
    const origin = req.get("Origin");
    if (!origin || config.corsOrigins.includes(origin.replace(/\/+$/, ""))) return next();

    logger.warn({ origin, allowedOrigins: config.corsOrigins }, "[cors] origem recusada");
    return res.status(403).json({
      error: {
        code: "CORS_ORIGIN_DENIED",
        message: "A origem desta requisição não está autorizada.",
      },
    });
  }
);

app.use(
  cors({
    origin(origin, callback) {
      callback(null, !origin || config.corsOrigins.includes(origin.replace(/\/+$/, "")));
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "10kb" }));

// Global Rate Limiter
app.use(globalLimiter);

// CSRF Protection for state-changing requests
app.use("/api", csrfProtection);

// Routes
app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", eventsRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/reports", reportsRoutes);

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
