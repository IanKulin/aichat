// lib/provider-constants.ts - Provider runtime constants and helper functions

import type { SupportedProvider } from "../types/provider.ts";

/**
 * Provider metadata constant - single source of truth for all provider configuration
 */
export const PROVIDER_METADATA = {
  openai: {
    name: "OpenAI",
    envVar: "OPENAI_API_KEY",
  },
  anthropic: {
    name: "Anthropic",
    envVar: "ANTHROPIC_API_KEY",
  },
  google: {
    name: "Google",
    envVar: "GOOGLE_GENERATIVE_AI_API_KEY",
  },
  deepseek: {
    name: "DeepSeek",
    envVar: "DEEPSEEK_API_KEY",
  },
  openrouter: {
    name: "OpenRouter",
    envVar: "OPENROUTER_API_KEY",
  },
} as const;

/**
 * Array of all supported provider IDs
 */
export const SUPPORTED_PROVIDERS = Object.keys(PROVIDER_METADATA) as Array<
  keyof typeof PROVIDER_METADATA
>;

/**
 * Get the display name for a provider
 */
export function getProviderDisplayName(provider: SupportedProvider): string {
  return PROVIDER_METADATA[provider].name;
}

/**
 * Get the environment variable name for a provider's API key
 */
export function getProviderEnvVar(provider: SupportedProvider): string {
  return PROVIDER_METADATA[provider].envVar;
}

/**
 * Type guard to check if a string is a valid provider ID
 */
export function isValidProvider(
  provider: string
): provider is SupportedProvider {
  return provider in PROVIDER_METADATA;
}
