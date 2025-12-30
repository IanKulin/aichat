// middleware/validators/conversation.ts - Conversation-specific validation middleware

import { type Request, type Response, type NextFunction } from "express";
import {
  validateRequiredString,
  validateId,
  validatePositiveNumber,
  validateNonNegativeNumber,
  validateNumberRange,
  validateRole,
} from "./common.ts";
import { ValidationError } from "../../types/middleware.ts";

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
 * Validates request for creating a new conversation
 */
export function validateCreateConversation(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { title } = req.body;
    req.body.title = validateRequiredString(title, "Title");
    next();
  } catch (error) {
    handleValidationError(error, res, next);
  }
}

/**
 * Validates request for getting a conversation by ID
 */
export function validateGetConversation(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { id } = req.params;
    validateId(id, "Conversation ID");
    next();
  } catch (error) {
    handleValidationError(error, res, next);
  }
}

/**
 * Validates request for updating conversation title
 */
export function validateUpdateConversationTitle(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { id } = req.params;
    const { title } = req.body;

    validateId(id, "Conversation ID");
    req.body.title = validateRequiredString(title, "Title");
    next();
  } catch (error) {
    handleValidationError(error, res, next);
  }
}

/**
 * Validates request for deleting a conversation
 */
export function validateDeleteConversation(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { id } = req.params;
    validateId(id, "Conversation ID");
    next();
  } catch (error) {
    handleValidationError(error, res, next);
  }
}

/**
 * Validates request for saving a message to a conversation
 */
export function validateSaveMessage(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { conversationId, role, content } = req.body;

    validateId(conversationId, "Conversation ID");
    validateRole(role);
    req.body.content = validateRequiredString(content, "Content");
    next();
  } catch (error) {
    handleValidationError(error, res, next);
  }
}

/**
 * Validates request for listing conversations with pagination
 */
export function validateListConversations(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 50;
    const offset = req.query.offset
      ? parseInt(req.query.offset as string, 10)
      : 0;

    req.query.limit = validateNumberRange(limit, "Limit", 1, 100).toString();
    req.query.offset = validateNonNegativeNumber(offset, "Offset").toString();
    next();
  } catch (error) {
    handleValidationError(error, res, next);
  }
}

/**
 * Validates request for branching a conversation
 */
export function validateBranchConversation(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { id } = req.params;
    const { upToTimestamp, newTitle } = req.body;

    validateId(id, "Conversation ID");
    validatePositiveNumber(upToTimestamp, "upToTimestamp");
    req.body.newTitle = validateRequiredString(newTitle, "newTitle");
    next();
  } catch (error) {
    handleValidationError(error, res, next);
  }
}

/**
 * Validates request for cleaning up old conversations
 */
export function validateCleanupConversations(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const retentionDays = req.query.days
      ? parseInt(req.query.days as string, 10)
      : parseInt(process.env.CHAT_RETENTION_DAYS || "90", 10);

    req.query.days = validatePositiveNumber(
      retentionDays,
      "Retention days"
    ).toString();
    next();
  } catch (error) {
    handleValidationError(error, res, next);
  }
}
