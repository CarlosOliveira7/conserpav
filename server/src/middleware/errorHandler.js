import { AppError } from "../errors/AppError.js";
import { logger } from "../logger.js";

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // Postgres constraint errors
  if (err.code === "23505") {
    return res.status(409).json({
      error: {
        code: "DUPLICATE_ENTRY",
        message: "Já existe um registro com esses dados.",
      },
    });
  }
  if (err.code === "23503") {
    return res.status(400).json({
      error: {
        code: "FOREIGN_KEY_VIOLATION",
        message: "Registro relacionado não encontrado.",
      },
    });
  }
  if (err.code === "23514") {
    return res.status(400).json({
      error: {
        code: "CHECK_VIOLATION",
        message: "Dados fornecidos violam as restrições do sistema.",
      },
    });
  }
  if (err.code === "22P02") {
    return res.status(400).json({
      error: {
        code: "INVALID_IDENTIFIER",
        message: "Identificador inválido.",
      },
    });
  }

  logger.error({ errMessage: err.message, errCode: err.code }, "[api] erro não tratado");

  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Erro interno do servidor.",
    },
  });
}
