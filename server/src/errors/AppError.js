export class AppError extends Error {
  /**
   * @param {number} status HTTP status code (e.g. 400, 401, 403, 404, 409, 429)
   * @param {string} code Custom error code string (e.g. "BAD_REQUEST", "UNAUTHORIZED")
   * @param {string} message User-facing error message
   */
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
