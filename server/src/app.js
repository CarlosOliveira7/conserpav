import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
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
const here = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.resolve(process.env.FRONTEND_DIST || path.resolve(here, "../../dist"));

function normalizeOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isSameOrigin(req, origin) {
  return normalizeOrigin(origin) === `${req.protocol}://${req.get("host")}`;
}

app.set("trust proxy", 1);
app.disable("x-powered-by");

// Security headers allow the Google Fonts hosts referenced by index.html.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
        "img-src": ["'self'", "data:"],
      },
    },
  })
);

// CORS with credentials support
app.use(
  (req, res, next) => {
    const origin = req.get("Origin");
    const normalizedOrigin = origin && normalizeOrigin(origin);
    if (
      !origin ||
      isSameOrigin(req, origin) ||
      (normalizedOrigin && config.corsOrigins.includes(normalizedOrigin))
    ) {
      return next();
    }

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
      callback(null, Boolean(origin && config.corsOrigins.includes(normalizeOrigin(origin))));
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

// API paths must never fall through to the SPA document.
app.use("/api", (_req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "Rota não encontrada.",
    },
  });
});

if (existsSync(frontendDist)) {
  app.use(
    express.static(frontendDist, {
      setHeaders(res, filePath) {
        const fileName = path.basename(filePath);
        if (["index.html", "sw.js", "manifest.json"].includes(fileName)) {
          res.setHeader("Cache-Control", "no-cache");
        } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    })
  );

  app.get("*", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.join(frontendDist, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

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
