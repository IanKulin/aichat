// lib/types.ts - Shared type definitions for the application

export type { SupportedProvider } from "./provider-metadata.ts";

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type ProviderConfig = {
  name: string;
  models: string[];
  defaultModel: string;
  testModel: string;
};

export type ApiKeyValidation = {
  valid: boolean;
  message: string;
};

export type ProviderInfo = {
  id: string;
  name: string;
  models: string[];
  defaultModel: string;
};

export type ApiKeyStatus = {
  configured: boolean;
  maskedKey?: string;
  valid?: boolean;
  lastValidated?: number;
};
