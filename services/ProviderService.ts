// services/ProviderService.ts - Provider management service

import { ConfigService } from "./ConfigService.ts";
import { ProviderRepository } from "../repositories/ProviderRepository.ts";
import { SUPPORTED_PROVIDERS } from "../lib/provider-metadata.ts";
import { logger } from "../lib/logger.ts";

// Import shared types
import type {
  SupportedProvider,
  ApiKeyValidation,
  ProviderInfo,
} from "../lib/types.ts";

export abstract class ProviderService {
  abstract getAvailableProviders(): SupportedProvider[];
  abstract getProviderInfo(): ProviderInfo[];
  abstract validateProvider(provider: string): boolean;
  abstract getProviderModel(
    provider: SupportedProvider,
    model?: string
  ): unknown;
  abstract validateApiKey(provider: SupportedProvider): ApiKeyValidation;
  abstract validateAllProviders(): Record<SupportedProvider, ApiKeyValidation>;
}

export class DefaultProviderService extends ProviderService {
  private configService: ConfigService;
  private providerRepository: ProviderRepository;

  constructor(
    configService: ConfigService,
    providerRepository: ProviderRepository
  ) {
    super();
    this.configService = configService;
    this.providerRepository = providerRepository;
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

    return this.providerRepository.getProvider(provider, selectedModel);
  }

  validateApiKey(provider: SupportedProvider): ApiKeyValidation {
    return this.providerRepository.validateApiKey(provider);
  }

  validateAllProviders(): Record<SupportedProvider, ApiKeyValidation> {
    const results = {} as Record<SupportedProvider, ApiKeyValidation>;

    SUPPORTED_PROVIDERS.forEach((provider) => {
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
      logger.warn(
        `Model '${model}' for ${provider} appears to be experimental.`
      );
    }
  }
}
