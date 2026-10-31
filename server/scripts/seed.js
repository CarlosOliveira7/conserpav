// Script de Seed para criação do usuário Administrador inicial do Conserpav.
// Uso: npm run db:seed  OU  node scripts/seed.js [email] [senha]
// Pode ser configurado via variáveis de ambiente: ADMIN_EMAIL e ADMIN_PASSWORD.
import bcrypt from "bcryptjs";
import { pool } from "../src/db.js";

const DEFAULT_ADMIN_EMAIL = "admin@conserpav.com";
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123456";

const args = process.argv.slice(2);
const emailInput = args[0] || process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
const passwordInput = args[1] || DEFAULT_ADMIN_PASSWORD;

function maskEmail(emailStr) {
  if (!emailStr || !emailStr.includes("@")) return "***";
  const [name, domain] = emailStr.split("@");
  return `${name[0]}***@${domain}`;
}

function isValidEmail(emailStr) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof emailStr === "string" && emailRegex.test(emailStr.trim());
}

async function seed() {
  const normalizedEmail = emailInput.trim().toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    console.error(`✘ Erro: E-mail "${emailInput}" inválido.`);
    process.exitCode = 1;
    return;
  }

  if (!passwordInput || passwordInput.length < 8) {
    console.error("✘ Erro: A senha deve ter no mínimo 8 caracteres.");
    process.exitCode = 1;
    return;
  }

  console.log(`[seed] Verificando existência do usuário admin (${maskEmail(normalizedEmail)})...`);

  // 1. Verifica se o usuário já existe para evitar erro de unique constraint
  const { rows: existingUsers } = await pool.query(
    "SELECT id, email FROM users WHERE lower(email) = lower($1)",
    [normalizedEmail]
  );

  if (existingUsers.length > 0) {
    const existingUser = existingUsers[0];
    console.log(`ℹ Usuário admin (${maskEmail(existingUser.email)}) já cadastrado no banco.`);

    // Garante que o registro em proprietários existe
    await pool.query(
      "INSERT INTO proprietarios (id, empresa_nome) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING",
      [existingUser.id, "Conserpav Engenharia"]
    );

    console.log("✔ Seed concluído com sucesso (nenhuma duplicação gerada).");
    return;
  }

  // 2. Se não existir, criptografa a senha com bcrypt (12 rounds)
  const passwordHash = await bcrypt.hash(passwordInput, 12);

  // 3. Insere o usuário na tabela users
  const { rows: newUsers } = await pool.query(
    "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
    [normalizedEmail, passwordHash]
  );

  const newUser = newUsers[0];

  // 4. Cria o registro na tabela proprietarios
  await pool.query(
    "INSERT INTO proprietarios (id, empresa_nome) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING",
    [newUser.id, "Conserpav Engenharia"]
  );

  console.log(`✔ Usuário administrador criado com sucesso: ${maskEmail(newUser.email)}`);
  console.log("✔ Seed finalizado.");
}

try {
  await seed();
} catch (err) {
  console.error("✘ Erro durante o seed:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
