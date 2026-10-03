// Aplica database/schema.sql no banco apontado por DATABASE_URL.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { pool } from "../src/db.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(path.join(here, "../../database/schema.sql"), "utf8");

try {
  await pool.query(sql);
  console.log("✔ Schema aplicado com sucesso.");
} catch (err) {
  console.error("✘ Falha ao aplicar o schema:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
