// lib/ai-client.ts

import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { deepseek } from "@ai-sdk/deepseek";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateText, streamText } from "ai";
import fs from "fs";
import path from "path";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export type SupportedProvider =
  | "openai"
  | "anthropic"
  | "google"
  | "deepseek"
  | "openrouter";

interface ProviderConfig {
  name: string;
  models: string[];
  defaultModel: string;
}

interface ModelsConfig {
  [key: string]: ProviderConfig;
}

function validateModelsJson(
  data: Record<string, unknown>
): data is ModelsConfig {
  const requiredProviders: SupportedProvider[] = [
    "openai",
    "anthropic",
    "google",
    "deepseek",
    "openrouter",
  ];

  for (const provider of requiredProviders) {
    if (!data[provider]) {
      throw new Error(`Missing required provider: ${provider}`);
    }

    const config = data[provider] as ProviderConfig;
    if (!config.name || !Array.isArray(config.models) || !config.defaultModel) {
      throw new Error(`Invalid configuration for provider: ${provider}`);
    }

    if (!config.models.includes(config.defaultModel)) {
      throw new Error(
        `Default model ${config.defaultModel} not in models list for ${provider}`
      );
    }
  }
  return true;
}

// Load provider configurations from JSON file
function loadModelsConfig(): Record<string, ProviderConfig> {
  try {
    const configPath = path.join(
      process.cwd(),
      "data",
      "config",
      "models.json"
    );
    const configData = fs.readFileSync(configPath, "utf-8");
    const configs = JSON.parse(configData);

    validateModelsJson(configs);

    return configs;
  } catch (error) {
    if (error instanceof Error) {
      console.error("FATAL: Invalid models.json configuration:", error.message);
    } else {
      console.error(
        "FATAL: An unknown error occurred while loading configuration."
      );
    }
    process.exit(1);
  }
}

// Runtime model validation to warn about deprecated or experimental models
function validateModelAtRuntime(
  provider: SupportedProvider,
  model: string
): void {
  const warnings = {
    deprecated: ["gpt-3.5-turbo-0613", "claude-2", "claude-instant-v1"],
    experimental: ["-preview-", "-exp", "-lite-preview-", "-experimental"],
  };

  // Check for deprecated models
  if (warnings.deprecated.some((deprecated) => model.includes(deprecated))) {
    console.warn(
      `⚠️  Model '${model}' for ${provider} may be deprecated. Consider updating to a newer model.`
    );
  }

  // Check for experimental models
  if (warnings.experimental.some((exp) => model.includes(exp))) {
    console.warn(
      `🧪 Model '${model}' for ${provider} appears to be experimental. Monitor for changes.`
    );
  }
}

// Provider configurations (loaded from config/models.json or fallback)
export const providerConfigs = loadModelsConfig();

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
    throw new Error(
      `Model ${selectedModel} not supported by ${
        config.name
      }. Available models: ${config.models.join(", ")}`
    );
  }

  // Runtime validation: warn if model might be deprecated or experimental
  validateModelAtRuntime(provider, selectedModel);

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
    case "openrouter":
      if (!process.env.OPENROUTER_API_KEY) {
        throw new Error(
          `Provider ${provider} is not configured (API key missing)`
        );
      }
      return openrouter(selectedModel);
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
    openrouter: process.env.OPENROUTER_API_KEY,
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

  if (provider === "openrouter" && !apiKey.startsWith("sk-or-")) {
    return {
      valid: false,
      message: 'OpenRouter API key should start with "sk-or-"',
    };
  }

  if (apiKey.length < 10) {
    return {
      valid: false,
      message: `${providerName} API key appears to be too short`,
    };
  }

  return { valid: true, message: `${providerName} API key format looks valid` };
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
      maxOutputTokens: 1000,
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

    const result = streamText({
      model: providerModel,
      messages,
      maxOutputTokens: 1000,
      temperature: 0.7,
    });

    return result.toUIMessageStreamResponse();
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
    [
      "openai",
      "anthropic",
      "google",
      "deepseek",
      "openrouter",
    ] as SupportedProvider[]
  ).forEach((provider) => {
    results[provider] = validateApiKey(provider);
  });

  return results;
}
