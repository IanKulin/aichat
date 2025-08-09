import { type Request, type Response, type NextFunction } from "express";
import { logger } from "../lib/logger.ts";

interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
}

/**
 * Sanitizes error messages to prevent exposing internal details to clients
 */
export function getClientErrorMessage(error: Error): string {
  const message = error.message.toLowerCase();

  if (message.includes("api key")) {
    return "Service configuration error. Please try again later.";
  }
  if (message.includes("network")) {
    return "Network error. Please check your connection and try again.";
  }
  if (message.includes("model")) {
    return "Selected model is not available. Please try a different model.";
  }

  return "Sorry, I'm having trouble processing your request right now.";
}

/**
 * Centralized error handling middleware
 * Logs errors and returns sanitized error responses to clients
 */
export function errorHandler(
  error: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error(`${req.method} ${req.path}:`, error.message);

  // Don't double-handle errors
  if (res.headersSent) {
    next(error);
    return;
  }

  const status = error.status || error.statusCode || 500;
  const clientMessage = getClientErrorMessage(error);

  res.status(status).json({
    error: status === 500 ? "Internal server error" : "Service Error",
    message: status === 500 ? "Something went wrong" : clientMessage,
  });
}

/**
 * Async error wrapper for route handlers
 * Catches async errors and forwards them to the error handling middleware
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}