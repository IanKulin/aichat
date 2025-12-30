// middleware/validators/common.ts - Reusable validation helper functions

import { ValidationError } from "../../types/middleware.ts";
import type { ChatMessage } from "../../types/index.ts";

/**
 * Validates that a value is a non-empty string and returns the trimmed value
 */
export function validateRequiredString(
  value: unknown,
  fieldName: string
): string {
  if (!value || typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(
      `${fieldName} is required and must be a non-empty string`
    );
  }
  return value.trim();
}

/**
 * Validates that a value is a positive number (greater than 0)
 */
export function validatePositiveNumber(
  value: unknown,
  fieldName: string
): number {
  if (typeof value !== "number" || value <= 0) {
    throw new ValidationError(`${fieldName} must be a positive number`);
  }
  return value;
}

/**
 * Validates that a value is a non-negative number (>= 0)
 */
export function validateNonNegativeNumber(
  value: unknown,
  fieldName: string
): number {
  if (typeof value !== "number" || value < 0) {
    throw new ValidationError(`${fieldName} must be a non-negative number`);
  }
  return value;
}

/**
 * Validates that a number is within a specified range
 */
export function validateNumberRange(
  value: number,
  fieldName: string,
  min: number,
  max: number
): number {
  if (isNaN(value) || value < min || value > max) {
    throw new ValidationError(
      `${fieldName} must be a number between ${min} and ${max}`
    );
  }
  return value;
}

/**
 * Validates that a value is a valid message role
 */
export function validateRole(value: unknown): "user" | "assistant" | "system" {
  if (!["user", "assistant", "system"].includes(value as string)) {
    throw new ValidationError(
      "Valid role is required (user, assistant, or system)"
    );
  }
  return value as "user" | "assistant" | "system";
}

/**
 * Validates that a value is a non-empty string ID
 */
export function validateId(value: unknown, fieldName: string = "ID"): string {
  if (!value || typeof value !== "string") {
    throw new ValidationError(`${fieldName} is required`);
  }
  return value;
}

/**
 * Validates an array of chat messages
 */
export function validateMessages(messages: unknown): ChatMessage[] {
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
      throw new ValidationError(
        "Message role must be user, assistant, or system"
      );
    }
  }

  return messages as ChatMessage[];
}
