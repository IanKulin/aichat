// lib/types.ts - Shared type definitions for the application

export type SupportedProvider =
  | "openai"
  | "anthropic"
  | "google"
  | "deepseek"
  | "openrouter";

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type ProviderConfig = {
  name: string;
  models: string[];
  defaultModel: string;
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
