// lib/ai-client.ts

import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { deepseek } from "@ai-sdk/deepseek";
import { generateText, streamText } from "ai";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export type SupportedProvider = "openai" | "anthropic" | "google" | "deepseek";

interface ProviderConfig {
  name: string;
  models: string[];
  defaultModel: string;
}

// Provider configurations
export const providerConfigs: Record<SupportedProvider, ProviderConfig> = {
  openai: {
    name: "OpenAI",
    models: ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"],
    defaultModel: "gpt-3.5-turbo",
  },
  anthropic: {
    name: "Anthropic",
    models: [
      "claude-3-haiku-20240307",
      "claude-3-7-sonnet-20250219",
      "claude-sonnet-4-20250514",
    ],
    defaultModel: "claude-3-haiku-20240307",
  },
  google: {
    name: "Google",
    models: [
      "gemini-2.5-flash-lite-preview-06-17",
      "gemini-2.5-flash",
      "gemini-2.5-pro",
    ],
    defaultModel: "gemini-2.5-flash",
  },
  deepseek: {
    name: "DeepSeek",
    models: ["deepseek-chat", "deepseek-coder", "deepseek-reasoner"],
    defaultModel: "deepseek-chat",
  },
};

interface ApiKeyValidation {
  valid: boolean;
  message: string;
}

// Helper function to get provider model
function getProviderModel(provider: SupportedProvider, model?: string) {
  const config = providerConfigs[provider];
  const selectedModel = model || config.defaultModel;

  // Validate model is supported by provider
  if (!config.models.includes(selectedModel)) {
    throw new Error(`Model ${selectedModel} not supported by ${config.name}`);
  }

  // Initialize provider dynamically to handle environment variable loading
  switch (provider) {
    case "openai":
      if (!process.env.OPENAI_API_KEY) {
        throw new Error(
          `Provider ${provider} is not configured (API key missing)`
        );
      }
      return openai(selectedModel);
    case "anthropic":
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error(
          `Provider ${provider} is not configured (API key missing)`
        );
      }
      return anthropic(selectedModel);
    case "google":
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        throw new Error(
          `Provider ${provider} is not configured (API key missing)`
        );
      }
      return google(selectedModel);
    case "deepseek":
      if (!process.env.DEEPSEEK_API_KEY) {
        throw new Error(
          `Provider ${provider} is not configured (API key missing)`
        );
      }
      return deepseek(selectedModel);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// Validate API key for a specific provider
export function validateApiKey(
  provider: SupportedProvider = "openai"
): ApiKeyValidation {
  const keyMap = {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    google: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY,
  };

  const apiKey = keyMap[provider];
  const providerName = providerConfigs[provider].name;

  if (!apiKey) {
    return {
      valid: false,
      message: `${providerName} API key not found in environment variables`,
    };
  }

  // Provider-specific validation
  if (provider === "openai" && !apiKey.startsWith("sk-")) {
    return { valid: false, message: 'OpenAI API key should start with "sk-"' };
  }

  if (apiKey.length < 10) {
    return {
      valid: false,
      message: `${providerName} API key appears to be too short`,
    };
  }

  return { valid: true, message: `${providerName} API key format looks valid` };
}

// Get available providers (only those with valid API keys)
export function getAvailableProviders(): SupportedProvider[] {
  return (
    ["openai", "anthropic", "google", "deepseek"] as SupportedProvider[]
  ).filter((provider) => validateApiKey(provider).valid);
}

// Get provider configuration
export function getProviderConfig(provider: SupportedProvider): ProviderConfig {
  return providerConfigs[provider];
}

// Generate text (non-streaming) - backward compatible with existing code
export async function sendMessage(
  messages: ChatMessage[],
  provider: SupportedProvider = "openai",
  model?: string
): Promise<string> {
  try {
    const providerModel = getProviderModel(provider, model);

    const result = await generateText({
      model: providerModel,
      messages,
      maxTokens: 1000,
      temperature: 0.7,
    });

    return result.text;
  } catch (error) {
    if (error instanceof Error) {
      // Enhance error messages for better debugging
      if (error.message.includes("API key")) {
        throw new Error(
          `${providerConfigs[provider].name} API key issue: ${error.message}`
        );
      }
      if (error.message.includes("model")) {
        throw new Error(
          `Model error for ${providerConfigs[provider].name}: ${error.message}`
        );
      }
      throw new Error(
        `${providerConfigs[provider].name} API error: ${error.message}`
      );
    }
    throw error;
  }
}

// Stream text (new feature for real-time responses)
export async function streamMessage(
  messages: ChatMessage[],
  provider: SupportedProvider = "openai",
  model?: string
) {
  try {
    const providerModel = getProviderModel(provider, model);

    const result = await streamText({
      model: providerModel,
      messages,
      maxTokens: 1000,
      temperature: 0.7,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    if (error instanceof Error) {
      // Enhanced error handling for streaming
      if (error.message.includes("API key")) {
        throw new Error(
          `${providerConfigs[provider].name} API key issue: ${error.message}`
        );
      }
      if (error.message.includes("model")) {
        throw new Error(
          `Model error for ${providerConfigs[provider].name}: ${error.message}`
        );
      }
      throw new Error(
        `${providerConfigs[provider].name} streaming error: ${error.message}`
      );
    }
    throw error;
  }
}

// Validate all configured providers on startup
export function validateAllProviders(): Record<
  SupportedProvider,
  ApiKeyValidation
> {
  const results = {} as Record<SupportedProvider, ApiKeyValidation>;

  (
    ["openai", "anthropic", "google", "deepseek"] as SupportedProvider[]
  ).forEach((provider) => {
    results[provider] = validateApiKey(provider);
  });

  return results;
}
