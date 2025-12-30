import { type Request, type Response, type NextFunction } from "express";
import { ValidationError } from "../types/middleware.ts";

export { ValidationError };

/**
 * Generic JSON body validation middleware
 */
export function validateJsonBody(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
    if (!req.is("application/json")) {
      res.status(400).json({
        error: "Content-Type Error",
        message: "Request must be application/json",
      });
      return;
    }
  }
  next();
}
