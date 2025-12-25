// repositories/ProviderRepository.ts - Data access layer for provider instantiation

import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { deepseek } from "@ai-sdk/deepseek";
import { openrouter } from "@openrouter/ai-sdk-provider";
import {
  SUPPORTED_PROVIDERS,
  getProviderDisplayName,
  getProviderEnvVar,
  isValidProvider,
} from "../lib/provider-metadata.ts";
import type { SupportedProvider, ApiKeyValidation } from "../lib/types.ts";
import type { ISettingsRepository } from "./SettingsRepository.ts";

export type ProviderInstance = unknown;

export abstract class ProviderRepository {
  abstract getProvider(provider: SupportedProvider, model: string): ProviderInstance;
  abstract validateApiKey(provider: SupportedProvider): ApiKeyValidation;
  abstract hasValidApiKey(provider: SupportedProvider): boolean;
  abstract clearCache(): void;
  abstract reloadApiKeys(): void;
}

export class DefaultProviderRepository extends ProviderRepository {
  private providerCache = new Map<string, ProviderInstance>();
  private settingsRepository: ISettingsRepository;

  constructor(settingsRepository: ISettingsRepository) {
    super();
    this.settingsRepository = settingsRepository;
    // Load API keys from database into process.env on startup
    this.syncKeysToEnvironment();
  }

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
    // Handle invalid providers gracefully (can happen at runtime despite type checking)
    if (!isValidProvider(provider)) {
      return {
        valid: false,
        message: `Unknown provider: ${provider}`,
      };
    }

    const envVarName = getProviderEnvVar(provider);
    const apiKey = process.env[envVarName];
    const providerName = getProviderDisplayName(provider);

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

  reloadApiKeys(): void {
    // Clear cached provider instances
    this.providerCache.clear();

    // Reload keys from database into process.env
    this.syncKeysToEnvironment();
  }

  /**
   * Synchronizes API keys from database to process.env.
   *
   * When a key exists in the database, it is set in process.env.
   * When a key is null/undefined in the database, it is explicitly deleted from process.env.
   *
   * This ensures database deletions immediately affect runtime behavior and the AI SDK
   * receives up-to-date credentials.
   *
   * @private
   */
  private syncKeysToEnvironment(): void {
    const keys = this.settingsRepository.getAllApiKeys();

    // For each provider, set or delete the environment variable
    SUPPORTED_PROVIDERS.forEach((provider) => {
      const envVarName = getProviderEnvVar(provider);
      const apiKey = keys[provider];

      if (apiKey) {
        process.env[envVarName] = apiKey;
      } else {
        delete process.env[envVarName];
      }
    });
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