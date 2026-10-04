import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { query } from "../db.js";
import { signToken } from "../auth.js";
import { AppError } from "../errors/AppError.js";
import { sendPasswordResetEmail } from "../mailer.js";
import { config } from "../config.js";

const BCRYPT_ROUNDS = 12;
const DUMMY_HASH = "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi";

export async function loginUser(email, password) {
  const { rows } = await query(
    "SELECT id, email, password_hash FROM users WHERE lower(email) = $1",
    [email]
  );
  const user = rows[0];
  const ok = await bcrypt.compare(password, user?.password_hash || DUMMY_HASH);

  if (!user || !ok) {
    throw new AppError(401, "INVALID_CREDENTIALS", "E-mail ou senha incorretos.");
  }

  const token = signToken(user);
  return { token, user: { id: user.id, email: user.email } };
}

export async function requestPasswordReset(email) {
  const { rows } = await query(
    "SELECT id, email FROM users WHERE lower(email) = $1",
    [email]
  );

  if (rows[0]) {
    const userId = rows[0].id;
    // Invalidate existing unused reset tokens for this user
    await query(
      "UPDATE password_resets SET used_at = now() WHERE user_id = $1 AND used_at IS NULL",
      [userId]
    );

    const token = crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash("sha256").update(token).digest("hex");

    await query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at)
       VALUES ($1, $2, now() + interval '1 hour')`,
      [userId, hash]
    );

    const link = `${config.appUrl}/?recover=true&token=${token}`;
    try {
      await sendPasswordResetEmail(rows[0].email, link);
    } catch (err) {
      console.error("[mailer] falha ao enviar e-mail:", err.message);
    }
  }

  // Always return success to prevent user enumeration
  return { ok: true };
}

export async function resetPasswordWithToken(token, password) {
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const { rows } = await query(
    `SELECT id, user_id
       FROM password_resets
      WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()`,
    [hash]
  );

  if (!rows[0]) {
    throw new AppError(400, "INVALID_RESET_TOKEN", "Link de recuperação inválido ou expirado.");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const userId = rows[0].user_id;

  await query(
    "UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2",
    [passwordHash, userId]
  );
  await query(
    "UPDATE password_resets SET used_at = now() WHERE user_id = $1 AND used_at IS NULL",
    [userId]
  );

  return { ok: true };
}

export async function updatePassword(userId, currentPassword, newPassword) {
  const { rows } = await query(
    "SELECT password_hash FROM users WHERE id = $1",
    [userId]
  );

  if (!rows[0] || !(await bcrypt.compare(currentPassword, rows[0].password_hash))) {
    throw new AppError(403, "INCORRECT_PASSWORD", "Senha atual incorreta.");
  }

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await query(
    "UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2",
    [newHash, userId]
  );

  return { ok: true };
}

export async function updateEmail(userId, newEmail, currentPassword) {
  const { rows } = await query(
    "SELECT password_hash FROM users WHERE id = $1",
    [userId]
  );

  if (!rows[0] || !(await bcrypt.compare(currentPassword, rows[0].password_hash))) {
    throw new AppError(403, "INCORRECT_PASSWORD", "Senha atual incorreta.");
  }

  const updated = await query(
    "UPDATE users SET email = $1, updated_at = now() WHERE id = $2 RETURNING id, email",
    [newEmail, userId]
  );

  const user = updated.rows[0];
  const token = signToken(user);
  return { token, user };
}
