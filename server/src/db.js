import pg from "pg";
import { config } from "./config.js";

// O driver "pg" devolve DATE como objeto Date por padrão; mantemos como string YYYY-MM-DD.
// NUMERIC (1700) agora é retornado como string para preservar a precisão decimal exata.
pg.types.setTypeParser(1082, (value) => value); // DATE -> string

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
  max: Number(process.env.DB_POOL_MAX || 10),
  idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT_MS || 30000),
  connectionTimeoutMillis: Number(process.env.DB_POOL_CONN_TIMEOUT_MS || 5000),
});

pool.on("error", (err) => {
  console.error("[db] erro inesperado no pool:", err.message);
});

export const query = (text, params) => pool.query(text, params);

/**
 * Executes a function within a database transaction.
 * @param {function(pg.PoolClient): Promise<any>} fn
 */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
