// types/core.ts - Core domain types

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type ApiKeyValidation = {
  valid: boolean;
  message: string;
};

export type ApiKeyStatus = {
  configured: boolean;
  maskedKey?: string;
  valid?: boolean;
  lastValidated?: number;
};
