import { type Request, type Response, type NextFunction } from "express";
import type { ChatMessage } from "../lib/types.ts";
import { getProviderService } from "../lib/services.ts";

interface ChatRequest {
  messages: ChatMessage[];
  provider?: string;
  model?: string;
}

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

    // Validate messages array
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new ValidationError("Messages array is required");
    }

    // Validate last message has content
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || !lastMessage.content) {
      throw new ValidationError("Last message must have content");
    }

    // Validate message structure
    for (const message of messages) {
      if (!message.role || !message.content) {
        throw new ValidationError("Each message must have role and content");
      }
      if (!["user", "assistant", "system"].includes(message.role)) {
        throw new ValidationError("Message role must be user, assistant, or system");
      }
    }

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
    if (error instanceof ValidationError) {
      res.status(error.status).json({
        error: "Validation Error",
        message: error.message,
      });
    } else {
      next(error);
    }
  }
}

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