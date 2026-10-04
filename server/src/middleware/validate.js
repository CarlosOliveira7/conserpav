import { AppError } from "../errors/AppError.js";

/**
 * Middleware factory for validating HTTP requests using Zod schemas.
 * @param {object} schemas
 * @param {import("zod").ZodSchema} [schemas.body]
 * @param {import("zod").ZodSchema} [schemas.query]
 * @param {import("zod").ZodSchema} [schemas.params]
 */
export function validate(schemas) {
  return (req, _res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (err) {
      if (err.name === "ZodError") {
        const issue = err.issues[0];
        const fieldName = issue.path.join(".");
        const message = fieldName ? `${fieldName}: ${issue.message}` : issue.message || "Dados de entrada inválidos.";
        return next(new AppError(400, "VALIDATION_ERROR", message));
      }
      next(err);
    }
  };
}
