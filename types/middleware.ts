// types/middleware.ts - Middleware types

/**
 * Validation error class for better error handling
 */
export class ValidationError extends Error {
  status: number;

  constructor(message: string, status: number = 400) {
    super(message);
    this.name = "ValidationError";
    this.status = status;
  }
}
