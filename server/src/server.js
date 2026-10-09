import app from "./app.js";
import { config } from "./config.js";
import { pool } from "./db.js";
import { closeEvents, initEvents } from "./events.js";
import { logger } from "./logger.js";

const server = app.listen(config.port, "0.0.0.0", () => {
  logger.info(`[api] rodando na porta ${config.port}`);
  initEvents();
});

let shuttingDown = false;

async function gracefulShutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`[api] sinal ${signal} recebido, iniciando encerramento gracioso...`);

  server.close(async () => {
    logger.info("[api] servidor HTTP encerrado.");
    try {
      await closeEvents();
      await pool.end();
      logger.info("[api] conexões com o banco e SSE encerradas.");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "[api] erro ao encerrar recursos");
      process.exit(1);
    }
  });

  // Force exit if shutdown takes longer than 10 seconds
  setTimeout(() => {
    logger.error("[api] encerramento forçado por timeout.");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
