import pg from "pg";
import { config } from "./config.js";

// Tempo real: um único client dedicado faz LISTEN no canal "table_changes"
// (alimentado pelos triggers do banco) e repassa cada mudança a todos os
// navegadores conectados via Server-Sent Events.
const clients = new Set();
let listener = null;

async function startListener() {
  const client = new pg.Client({
    connectionString: config.databaseUrl,
    ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
  });

  client.on("notification", (msg) => {
    for (const res of clients) res.write(`data: ${msg.payload}\n\n`);
  });

  const retry = () => {
    listener = null;
    setTimeout(() => startListener().catch(() => {}), 3000);
  };
  client.on("error", (err) => {
    console.error("[events] conexão LISTEN caiu:", err.message);
    retry();
  });
  client.on("end", retry);

  try {
    await client.connect();
    await client.query("LISTEN table_changes");
    listener = client;
    console.log("[events] ouvindo canal table_changes");
  } catch (err) {
    console.error("[events] falha ao iniciar LISTEN:", err.message);
    retry();
  }
}

export function initEvents() {
  startListener();
  // Heartbeat: evita que proxies derrubem conexões ociosas.
  setInterval(() => {
    for (const res of clients) res.write(": ping\n\n");
  }, 25000).unref();
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
  clients.add(res);
  req.on("close", () => clients.delete(res));
}
