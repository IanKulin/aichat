// services/ProviderService.ts - Provider management service

import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { deepseek } from "@ai-sdk/deepseek";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { ConfigService } from "./ConfigService.ts";

// Re-declare types locally to avoid import issues with Node.js strip-types
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
}

export type ApiKeyValidation = {
  valid: boolean;
  message: string;
}

export type ProviderInfo = {
  id: string;
  name: string;
  models: string[];
  defaultModel: string;
}

export abstract class ProviderService {
  abstract getAvailableProviders(): SupportedProvider[];
  abstract getProviderInfo(): ProviderInfo[];
  abstract validateProvider(provider: string): boolean;
  abstract getProviderModel(provider: SupportedProvider, model?: string): any;
  abstract validateApiKey(provider: SupportedProvider): ApiKeyValidation;
  abstract validateAllProviders(): Record<SupportedProvider, ApiKeyValidation>;
}

export class DefaultProviderService extends ProviderService {
  private configService: ConfigService;

  constructor(configService: ConfigService) {
    super();
    this.configService = configService;
  }

  getAvailableProviders(): SupportedProvider[] {
    const validations = this.validateAllProviders();
    return Object.entries(validations)
      .filter(([_, validation]) => validation.valid)
      .map(([provider, _]) => provider as SupportedProvider);
  }

  getProviderInfo(): ProviderInfo[] {
    const availableProviders = this.getAvailableProviders();
    const configs = this.configService.getProviderConfigs();
    
    return availableProviders.map((provider) => ({
      id: provider,
      name: configs[provider].name,
      models: configs[provider].models,
      defaultModel: configs[provider].defaultModel,
    }));
  }

  validateProvider(provider: string): boolean {
    const availableProviders = this.getAvailableProviders();
    return availableProviders.includes(provider as SupportedProvider);
  }

  getProviderModel(provider: SupportedProvider, model?: string) {
    const config = this.configService.getProviderConfig(provider);
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
    this.validateModelAtRuntime(provider, selectedModel);

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

  validateApiKey(provider: SupportedProvider): ApiKeyValidation {
    const keyMap = {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      google: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      deepseek: process.env.DEEPSEEK_API_KEY,
      openrouter: process.env.OPENROUTER_API_KEY,
    };

    const apiKey = keyMap[provider];
    const providerConfig = this.configService.getProviderConfig(provider);
    const providerName = providerConfig.name;

    if (!apiKey || apiKey.length < 10) {
      return {
        valid: false,
        message: `${providerName} API key not configured`,
      };
    }

    return { valid: true, message: `${providerName} API key configured` };
  }

  validateAllProviders(): Record<SupportedProvider, ApiKeyValidation> {
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
      results[provider] = this.validateApiKey(provider);
    });

    return results;
  }

  private validateModelAtRuntime(
    provider: SupportedProvider,
    model: string
  ): void {
    if (
      model.includes("-preview-") ||
      model.includes("-exp") ||
      model.includes("-experimental")
    ) {
      console.warn(
        `Model '${model}' for ${provider} appears to be experimental.`
      );
    }
  }
}