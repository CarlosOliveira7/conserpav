import pg from "pg";
import { config } from "./config.js";
import { logger } from "./logger.js";

const clients = new Set();
let listener = null;
let reconnectTimer = null;
let stopping = false;

async function startListener() {
  if (stopping) return;

  const client = new pg.Client({
    connectionString: config.databaseUrl,
    ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
  });

  client.on("notification", (msg) => {
    try {
      const payload = JSON.parse(msg.payload);
      const ownerId = payload.owner_id;

      for (const res of clients) {
        // Envia o evento apenas se o cliente pertencer ao mesmo proprietário (multi-tenant isolation)
        if (!ownerId || res.userId === ownerId) {
          res.write(`data: ${msg.payload}\n\n`);
        }
      }
    } catch {
      // Se não for JSON válido, faz broadcast genérico seguro
      for (const res of clients) res.write(`data: ${msg.payload}\n\n`);
    }
  });

  const retry = () => {
    listener = null;
    if (!stopping) {
      reconnectTimer = setTimeout(() => startListener().catch(() => {}), 3000);
    }
  };

  client.on("error", (err) => {
    logger.error({ errMessage: err.message }, "[events] conexão LISTEN caiu");
    retry();
  });

  client.on("end", retry);

  try {
    await client.connect();
    await client.query("LISTEN table_changes");
    listener = client;
    logger.info("[events] ouvindo canal table_changes");
  } catch (err) {
    logger.error({ errMessage: err.message }, "[events] falha ao iniciar LISTEN");
    retry();
  }
}

export function initEvents() {
  stopping = false;
  startListener();
  setInterval(() => {
    for (const res of clients) res.write(": ping\n\n");
  }, 25000).unref();
}

export async function closeEvents() {
  stopping = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  for (const res of clients) {
    try {
      res.end();
    } catch {
      /* ignore */
    }
  }
  clients.clear();
  if (listener) {
    try {
      await listener.end();
    } catch {
      /* ignore */
    }
    listener = null;
  }
}

export function eventsHandler(req, res) {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  res.write("retry: 3000\n\n");

  // Vincula a conexão SSE ao ID do usuário autenticado
  res.userId = req.user.id;
  clients.add(res);

  req.on("close", () => clients.delete(res));
}
