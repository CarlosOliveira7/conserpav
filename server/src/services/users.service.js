import bcrypt from "bcryptjs";
import { query } from "../db.js";
import { AppError } from "../errors/AppError.js";

const BCRYPT_ROUNDS = 12;

/**
 * Cria um novo usuário no banco com hash seguro bcrypt.
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<{ id: string, email: string, created_at: string }>}
 */
export async function createUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Verifica se já existe um usuário com este e-mail
  const existing = await query("SELECT id FROM users WHERE lower(email) = $1", [normalizedEmail]);
  if (existing.rows.length > 0) {
    throw new AppError(409, "USER_ALREADY_EXISTS", "Este e-mail já está cadastrado.");
  }

  // 2. Converte a senha em hash com bcrypt
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // 3. Salva no banco de dados com tratamento para concorrência
  try {
    const { rows } = await query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at",
      [normalizedEmail, passwordHash]
    );

    const newUser = rows[0];

    // 4. Cria o registro na tabela proprietarios (perfil padrão do usuário)
    await query(
      "INSERT INTO proprietarios (id) VALUES ($1) ON CONFLICT (id) DO NOTHING",
      [newUser.id]
    );

    return {
      id: newUser.id,
      email: newUser.email,
      created_at: newUser.created_at,
    };
  } catch (err) {
    if (err.code === "23505") {
      throw new AppError(409, "USER_ALREADY_EXISTS", "Este e-mail já está cadastrado.");
    }
    throw err;
  }
}
