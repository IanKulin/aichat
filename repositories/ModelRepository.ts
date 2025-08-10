// repositories/ModelRepository.ts - Data access layer for model configurations

import fs from "fs";
import path from "path";
import type { SupportedProvider, ProviderConfig } from "../lib/types.ts";

export type ModelsConfig = {
  [key: string]: ProviderConfig;
}

export abstract class ModelRepository {
  abstract loadModelsConfig(): Record<string, ProviderConfig>;
  abstract validateModelsConfig(data: Record<string, unknown>): boolean;
}

export class FileModelRepository extends ModelRepository {
  private cachedConfig: Record<string, ProviderConfig> | null = null;

  loadModelsConfig(): Record<string, ProviderConfig> {
    if (this.cachedConfig) {
      return this.cachedConfig;
    }

    try {
      const configPath = path.join(
        process.cwd(),
        "data",
        "config",
        "models.json"
      );
      const configData = fs.readFileSync(configPath, "utf-8");
      const configs = JSON.parse(configData);

      this.validateModelsConfig(configs);
      this.cachedConfig = configs;

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

  validateModelsConfig(data: Record<string, unknown>): boolean {
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

  clearCache(): void {
    this.cachedConfig = null;
  }
}