// services/ConfigService.ts - Configuration management service

import fs from "fs";
import path from "path";

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

export type ModelsConfig = {
  [key: string]: ProviderConfig;
}

export abstract class ConfigService {
  abstract getProviderConfigs(): Record<string, ProviderConfig>;
  abstract getProviderConfig(provider: SupportedProvider): ProviderConfig;
  abstract validateConfiguration(): void;
}

export class DefaultConfigService extends ConfigService {
  private providerConfigs: Record<string, ProviderConfig>;

  constructor() {
    super();
    this.providerConfigs = this.loadModelsConfig();
  }

  getProviderConfigs(): Record<string, ProviderConfig> {
    return this.providerConfigs;
  }

  getProviderConfig(provider: SupportedProvider): ProviderConfig {
    const config = this.providerConfigs[provider];
    if (!config) {
      throw new Error(`Configuration not found for provider: ${provider}`);
    }
    return config;
  }

  validateConfiguration(): void {
    this.validateModelsJson(this.providerConfigs);
  }

  private validateModelsJson(
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

  private loadModelsConfig(): Record<string, ProviderConfig> {
    try {
      const configPath = path.join(
        process.cwd(),
        "data",
        "config",
        "models.json"
      );
      const configData = fs.readFileSync(configPath, "utf-8");
      const configs = JSON.parse(configData);

      this.validateModelsJson(configs);

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
}