// middleware/validators/settings.ts - Settings-specific validation middleware

import { type Request, type Response, type NextFunction } from "express";
import { ValidationError } from "../../types/middleware.ts";
import { isValidProvider } from "../../lib/provider-constants.ts";

/**
 * Helper to handle validation errors consistently
 */
function handleValidationError(
  error: unknown,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof ValidationError) {
    res.status(error.status).json({
      error: "Validation Error",
      message: error.message,
    });
  } else {
    next(error);
  }
}

/**
 * Validates request for setting an API key
 */
export function validateSetApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { provider, key } = req.body;

    if (!provider || !key) {
      throw new ValidationError("Provider and key are required");
    }

    if (!isValidProvider(provider)) {
      throw new ValidationError("Invalid provider");
    }

    next();
  } catch (error) {
    handleValidationError(error, res, next);
  }
}

/**
 * Validates request for deleting an API key
 */
export function validateDeleteApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { provider } = req.params;

    if (!isValidProvider(provider)) {
      throw new ValidationError("Invalid provider");
    }

    next();
  } catch (error) {
    handleValidationError(error, res, next);
  }
}
