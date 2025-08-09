// services/ConfigService.ts - Configuration management service

import { ModelRepository } from "../repositories/ModelRepository.ts";

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

export abstract class ConfigService {
  abstract getProviderConfigs(): Record<string, ProviderConfig>;
  abstract getProviderConfig(provider: SupportedProvider): ProviderConfig;
  abstract validateConfiguration(): void;
}

export class DefaultConfigService extends ConfigService {
  private modelRepository: ModelRepository;
  private providerConfigs: Record<string, ProviderConfig>;

  constructor(modelRepository: ModelRepository) {
    super();
    this.modelRepository = modelRepository;
    this.providerConfigs = this.modelRepository.loadModelsConfig();
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
    this.modelRepository.validateModelsConfig(this.providerConfigs);
  }
}