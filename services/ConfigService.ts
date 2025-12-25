// services/ConfigService.ts - Configuration management service

import type { ModelRepository } from "../types/repositories.ts";
import type { SupportedProvider, ProviderConfig } from "../types/index.ts";
import { ConfigService } from "../types/services.ts";

export { ConfigService };

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
