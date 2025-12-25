// services/SettingsService.ts - Settings management service

import { logger } from "../lib/logger.ts";
import {
  SUPPORTED_PROVIDERS,
  getProviderDisplayName,
} from "../lib/provider-metadata.ts";
import type { ISettingsRepository } from "../repositories/SettingsRepository.ts";
import type { ProviderRepository } from "../repositories/ProviderRepository.ts";
import type { ConfigService } from "./ConfigService.ts";
import type {
  SupportedProvider,
  ApiKeyStatus,
  ApiKeyValidation,
} from "../lib/types.ts";

export abstract class SettingsService {
  abstract getApiKeys(): Promise<Record<SupportedProvider, ApiKeyStatus>>;
  abstract setApiKey(
    provider: SupportedProvider,
    key: string
  ): Promise<ApiKeyValidation>;
  abstract deleteApiKey(provider: SupportedProvider): Promise<void>;
}

export class DefaultSettingsService extends SettingsService {
  private settingsRepository: ISettingsRepository;
  private providerRepository: ProviderRepository;
  private configService: ConfigService;

  constructor(
    settingsRepository: ISettingsRepository,
    providerRepository: ProviderRepository,
    configService: ConfigService
  ) {
    super();
    this.settingsRepository = settingsRepository;
    this.providerRepository = providerRepository;
    this.configService = configService;
  }

  async getApiKeys(): Promise<Record<SupportedProvider, ApiKeyStatus>> {
    const keys = this.settingsRepository.getAllApiKeys();
    const result = {} as Record<SupportedProvider, ApiKeyStatus>;

    SUPPORTED_PROVIDERS.forEach((provider) => {
      result[provider] = this.getKeyStatus(provider, keys[provider]);
    });

    return result;
  }

  private getKeyStatus(
    provider: SupportedProvider,
    key: string | null
  ): ApiKeyStatus {
    if (!key) {
      return { configured: false };
    }

    return {
      configured: true,
      maskedKey: this.maskApiKey(key),
    };
  }

  private maskApiKey(key: string): string {
    if (key.length < 16) {
      return "***";
    }
    // Show first 7 and last 4 characters: "sk-ant-***...***ptDw"
    return `${key.substring(0, 7)}***...***${key.substring(key.length - 4)}`;
  }

  async setApiKey(
    provider: SupportedProvider,
    key: string
  ): Promise<ApiKeyValidation> {
    // First, check format validation without saving
    const originalKey = this.settingsRepository.getApiKey(provider);
    this.settingsRepository.setApiKey(provider, key);
    this.providerRepository.reloadApiKeys();

    const formatValidation = this.providerRepository.validateApiKey(provider);

    // If format is invalid, rollback and return error
    if (!formatValidation.valid) {
      logger.warn(`API key format validation failed for ${provider}, rolling back`, {
        provider,
        reason: formatValidation.message,
        action: originalKey ? 'restored_previous_key' : 'deleted_invalid_key',
      });
      if (originalKey) {
        this.settingsRepository.setApiKey(provider, originalKey);
      } else {
        this.settingsRepository.deleteApiKey(provider);
      }
      this.providerRepository.reloadApiKeys();
      return formatValidation;
    }

    // Format is valid - key is already saved, now test API call
    const apiValidation = await this.testApiCall(provider);

    // Return validation result but keep the key saved regardless
    return apiValidation;
  }

  private async testApiCall(
    provider: SupportedProvider
  ): Promise<ApiKeyValidation> {
    // Use the test model from configuration
    const providerConfig = this.configService.getProviderConfig(provider);
    const testModel = providerConfig.testModel;

    try {
      // Make a minimal test call to verify key works

      const providerInstance = this.providerRepository.getProvider(
        provider,
        testModel
      );

      // Make a minimal test call (using AI SDK's generateText)
      const { generateText } = await import("ai");
      await generateText({
        model: providerInstance as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        prompt: "test",
      });

      return {
        valid: true,
        message: `${getProviderDisplayName(provider)} API key validated successfully`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`API key validation failed for ${provider}:`, {
        provider,
        model: testModel,
        error: errorMessage,
      });
      return {
        valid: false,
        message: `API key validation failed: ${errorMessage}`,
      };
    }
  }

  async deleteApiKey(provider: SupportedProvider): Promise<void> {
    this.settingsRepository.deleteApiKey(provider);
    this.providerRepository.reloadApiKeys();
  }
}
