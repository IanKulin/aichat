// middleware/validators/chat.ts - Chat-specific validation middleware

import { type Request, type Response, type NextFunction } from "express";
import { validateRequiredString, validateMessages } from "./common.ts";
import { ValidationError } from "../../types/middleware.ts";
import { getProviderService } from "../../lib/services.ts";
import type { ChatRequest } from "../../types/index.ts";

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
 * Validates chat request body structure and content
 */
export function validateChatRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { messages, provider }: ChatRequest = req.body;

    validateMessages(messages);

    // Validate provider if specified
    if (provider) {
      const providerService = getProviderService();
      const availableProviders = providerService.getAvailableProviders();

      if (!providerService.validateProvider(provider)) {
        throw new ValidationError(
          `Provider '${provider}' is not available. Available providers: ${availableProviders.join(", ")}`
        );
      }
    }

    next();
  } catch (error) {
    handleValidationError(error, res, next);
  }
}

/**
 * Validates request for generating a title
 */
export function validateGenerateTitleRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { firstMessage } = req.body;
    validateRequiredString(firstMessage, "First message");
    next();
  } catch (error) {
    handleValidationError(error, res, next);
  }
}
