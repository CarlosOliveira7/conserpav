import pg from "pg";
import { config } from "./config.js";

// O driver "pg" devolve NUMERIC como string e DATE como objeto Date. O front-end
// (herdado da versão Supabase/PostgREST) espera número e "YYYY-MM-DD", então
// ajustamos os parsers para manter o mesmo formato JSON.
pg.types.setTypeParser(1700, (value) => (value === null ? null : parseFloat(value))); // NUMERIC
pg.types.setTypeParser(1082, (value) => value); // DATE -> string

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
  max: 10,
});

pool.on("error", (err) => {
  console.error("[db] erro inesperado no pool:", err.message);
});

export const query = (text, params) => pool.query(text, params);
