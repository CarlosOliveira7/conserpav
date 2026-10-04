// Runner de migrações versionadas.
// Lê os arquivos em database/migrations/ em ordem numérica, executa cada um
// dentro de uma transação e registra em schema_migrations para não repetir.
//
// Uso:  npm run db:migrate   (dentro de /server)
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { pool } from "../src/db.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(here, "../../database/migrations");

async function run() {
  const client = await pool.connect();
  try {
    // Garante que a tabela de controle existe antes de qualquer outra coisa.
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id serial PRIMARY KEY,
        filename text NOT NULL UNIQUE,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const { rows: applied } = await client.query(
      "SELECT filename FROM schema_migrations ORDER BY filename"
    );
    const appliedSet = new Set(applied.map((row) => row.filename));

    const files = readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    let count = 0;
    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`  [ok]  ${file}`);
        continue;
      }

      const sql = readFileSync(path.join(migrationsDir, file), "utf8");

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (filename) VALUES ($1)",
          [file]
        );
        await client.query("COMMIT");
        console.log(`  [+]   ${file}`);
        count += 1;
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(`Falha ao aplicar ${file}: ${err.message}`);
      }
    }

    if (count === 0) {
      console.log("✔ Banco já está atualizado — nenhuma migração pendente.");
    } else {
      console.log(`✔ ${count} migração(ões) aplicada(s) com sucesso.`);
    }
  } finally {
    client.release();
  }
}

run()
  .catch((err) => {
    console.error("✘ Falha na migração:", err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
