// repositories/ProviderRepository.ts - Data access layer for provider instantiation

import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { deepseek } from "@ai-sdk/deepseek";
import { openrouter } from "@openrouter/ai-sdk-provider";

export type SupportedProvider =
  | "openai"
  | "anthropic"
  | "google"
  | "deepseek"
  | "openrouter";

export type ApiKeyValidation = {
  valid: boolean;
  message: string;
}

export type ProviderInstance = any;

export abstract class ProviderRepository {
  abstract getProvider(provider: SupportedProvider, model: string): ProviderInstance;
  abstract validateApiKey(provider: SupportedProvider): ApiKeyValidation;
  abstract hasValidApiKey(provider: SupportedProvider): boolean;
  abstract clearCache(): void;
}

export class DefaultProviderRepository extends ProviderRepository {
  private providerCache = new Map<string, ProviderInstance>();

  getProvider(provider: SupportedProvider, model: string): ProviderInstance {
    const cacheKey = `${provider}:${model}`;
    
    if (this.providerCache.has(cacheKey)) {
      return this.providerCache.get(cacheKey);
    }

    const providerInstance = this.createProviderInstance(provider, model);
    this.providerCache.set(cacheKey, providerInstance);
    
    return providerInstance;
  }

  validateApiKey(provider: SupportedProvider): ApiKeyValidation {
    const keyMap = {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      google: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      deepseek: process.env.DEEPSEEK_API_KEY,
      openrouter: process.env.OPENROUTER_API_KEY,
    };

    const providerNames = {
      openai: "OpenAI",
      anthropic: "Anthropic",
      google: "Google",
      deepseek: "DeepSeek",
      openrouter: "OpenRouter",
    };

    const apiKey = keyMap[provider];
    const providerName = providerNames[provider];

    if (!apiKey || apiKey.length < 10) {
      return {
        valid: false,
        message: `${providerName} API key not configured`,
      };
    }

    return { valid: true, message: `${providerName} API key configured` };
  }

  hasValidApiKey(provider: SupportedProvider): boolean {
    return this.validateApiKey(provider).valid;
  }

  clearCache(): void {
    this.providerCache.clear();
  }

  private createProviderInstance(provider: SupportedProvider, model: string): ProviderInstance {
    // Ensure API key is available before creating instance
    if (!this.hasValidApiKey(provider)) {
      throw new Error(`Provider ${provider} is not configured (API key missing)`);
    }

    switch (provider) {
      case "openai":
        return openai(model);
      case "anthropic":
        return anthropic(model);
      case "google":
        return google(model);
      case "deepseek":
        return deepseek(model);
      case "openrouter":
        return openrouter(model);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }
}