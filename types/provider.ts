// types/provider.ts - Provider-related types

/**
 * Type representing a supported provider ID
 */
export type SupportedProvider =
  | "openai"
  | "anthropic"
  | "google"
  | "deepseek"
  | "openrouter";

export type ProviderConfig = {
  name: string;
  models: string[];
  defaultModel: string;
  testModel: string;
};

export type ProviderInfo = {
  id: string;
  name: string;
  models: string[];
  defaultModel: string;
};
