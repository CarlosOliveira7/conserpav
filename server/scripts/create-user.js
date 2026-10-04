// Cria (ou redefine a senha de) um usuário administrador.
// Uso: npm run user:create -- email@exemplo.com minhaSenha
import bcrypt from "bcryptjs";
import { pool } from "../src/db.js";

const [email, password] = process.argv.slice(2);
if (!email || !password || password.length < 8) {
  console.error("Uso: npm run user:create -- <email> <senha com 8+ caracteres>");
  process.exit(1);
}

try {
  const hash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    `insert into users (email, password_hash) values ($1, $2)
     on conflict (lower(email)) do update set password_hash = excluded.password_hash, updated_at = now()
     returning id, email`,
    [email.trim().toLowerCase(), hash]
  );
  await pool.query(
    "insert into proprietarios (id) values ($1) on conflict (id) do nothing",
    [rows[0].id]
  );
  console.log(`✔ Usuário pronto: ${rows[0].email}`);
} catch (err) {
  console.error("✘ Erro:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
