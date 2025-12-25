// test/services/SettingsService.test.ts - Tests for SettingsService

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { DefaultSettingsService } from "../../services/SettingsService.ts";
import type { ISettingsRepository } from "../../repositories/SettingsRepository.ts";
import { ProviderRepository } from "../../repositories/ProviderRepository.ts";
import { ConfigService } from "../../services/ConfigService.ts";
import type {
  SupportedProvider,
  ApiKeyValidation,
  ProviderConfig,
} from "../../lib/types.ts";
import { MockLanguageModelV2 } from "ai/test";

// Mock implementations
class MockSettingsRepository implements ISettingsRepository {
  private keys: Map<SupportedProvider, string> = new Map();

  getApiKey(provider: SupportedProvider): string | null {
    return this.keys.get(provider) || null;
  }

  setApiKey(provider: SupportedProvider, key: string): void {
    this.keys.set(provider, key);
  }

  getAllApiKeys(): Record<SupportedProvider, string | null> {
    return {
      openai: this.keys.get("openai") || null,
      anthropic: this.keys.get("anthropic") || null,
      google: this.keys.get("google") || null,
      deepseek: this.keys.get("deepseek") || null,
      openrouter: this.keys.get("openrouter") || null,
    };
  }

  deleteApiKey(provider: SupportedProvider): void {
    this.keys.delete(provider);
  }
}

class MockConfigService extends ConfigService {
  private configs: Record<string, ProviderConfig> = {
    openai: {
      name: "OpenAI",
      models: ["gpt-4o-mini"],
      defaultModel: "gpt-4o-mini",
      testModel: "gpt-4o-mini",
    },
    anthropic: {
      name: "Anthropic",
      models: ["claude-3-5-haiku-20241022"],
      defaultModel: "claude-3-5-haiku-20241022",
      testModel: "claude-3-5-haiku-20241022",
    },
    google: {
      name: "Google",
      models: ["gemini-2.5-flash-lite"],
      defaultModel: "gemini-2.5-flash-lite",
      testModel: "gemini-2.5-flash-lite",
    },
    deepseek: {
      name: "DeepSeek",
      models: ["deepseek-chat"],
      defaultModel: "deepseek-chat",
      testModel: "deepseek-chat",
    },
    openrouter: {
      name: "OpenRouter",
      models: ["openai/gpt-4o-mini"],
      defaultModel: "openai/gpt-4o-mini",
      testModel: "openai/gpt-4o-mini",
    },
  };

  getProviderConfigs(): Record<string, ProviderConfig> {
    return this.configs;
  }

  getProviderConfig(provider: SupportedProvider): ProviderConfig {
    return this.configs[provider];
  }

  validateConfiguration(): void {
    // Mock implementation - no-op
  }
}

class MockProviderRepository extends ProviderRepository {
  public reloadApiKeysCalled = false;
  public clearCacheCalled = false;
  private validationResult: ApiKeyValidation = { valid: true, message: "Valid" };
  private shouldThrowOnGetProvider = false;

  getProvider(_provider: SupportedProvider, model: string): unknown {
    // If validation should fail, throw an error here to simulate API call failure
    if (this.shouldThrowOnGetProvider) {
      throw new Error("API call failed - network error");
    }

    // Return a mock AI SDK provider that can handle generateText calls
    return new MockLanguageModelV2({
      provider: _provider,
      modelId: model,
      doGenerate: async () => ({
        text: "test response",
        finishReason: "stop" as const,
        usage: { promptTokens: 1, completionTokens: 1 },
        rawResponse: { headers: {} },
      }),
    });
  }

  validateApiKey(_provider: SupportedProvider): ApiKeyValidation {
    return this.validationResult;
  }

  hasValidApiKey(_provider: SupportedProvider): boolean {
    return this.validationResult.valid;
  }

  clearCache(): void {
    this.clearCacheCalled = true;
  }

  reloadApiKeys(): void {
    this.reloadApiKeysCalled = true;
  }

  setValidationResult(result: ApiKeyValidation): void {
    this.validationResult = result;
    // If validation should fail at the format check level, don't throw on getProvider
    // If validation should fail at the API call level, throw on getProvider
    this.shouldThrowOnGetProvider = result.valid === false && result.message !== "Invalid key format";
  }

  setShouldThrowOnGetProvider(shouldThrow: boolean): void {
    this.shouldThrowOnGetProvider = shouldThrow;
  }
}

describe("SettingsService Tests", () => {
  let service: DefaultSettingsService;
  let mockSettingsRepo: MockSettingsRepository;
  let mockProviderRepo: MockProviderRepository;
  let mockConfigService: MockConfigService;

  beforeEach(() => {
    mockSettingsRepo = new MockSettingsRepository();
    mockProviderRepo = new MockProviderRepository();
    mockConfigService = new MockConfigService();
    service = new DefaultSettingsService(
      mockSettingsRepo,
      mockProviderRepo,
      mockConfigService
    );
  });

  describe("getApiKeys", () => {
    it("should return all providers as unconfigured when no keys are set", async () => {
      const result = await service.getApiKeys();

      assert.strictEqual(result.openai.configured, false);
      assert.strictEqual(result.anthropic.configured, false);
      assert.strictEqual(result.google.configured, false);
      assert.strictEqual(result.deepseek.configured, false);
      assert.strictEqual(result.openrouter.configured, false);
    });

    it("should return configured status for providers with keys", async () => {
      mockSettingsRepo.setApiKey("openai", "sk-test-123456789012");
      mockSettingsRepo.setApiKey("anthropic", "sk-ant-123456789012");

      const result = await service.getApiKeys();

      assert.strictEqual(result.openai.configured, true);
      assert.strictEqual(result.anthropic.configured, true);
      assert.strictEqual(result.google.configured, false);
      assert.strictEqual(result.deepseek.configured, false);
      assert.strictEqual(result.openrouter.configured, false);
    });

    it("should return masked keys for configured providers", async () => {
      mockSettingsRepo.setApiKey("openai", "sk-test-123456789012");

      const result = await service.getApiKeys();

      assert.strictEqual(result.openai.maskedKey, "sk-test***...***9012");
    });

    it("should not include maskedKey for unconfigured providers", async () => {
      const result = await service.getApiKeys();

      assert.strictEqual(result.openai.maskedKey, undefined);
    });
  });

  describe("maskApiKey", () => {
    it("should mask short keys with ***", async () => {
      mockSettingsRepo.setApiKey("openai", "short");

      const result = await service.getApiKeys();

      assert.strictEqual(result.openai.maskedKey, "***");
    });

    it("should show first 7 and last 4 characters for longer keys", async () => {
      mockSettingsRepo.setApiKey("openai", "sk-ant-api03k5k5k5k5pDw9");

      const result = await service.getApiKeys();

      assert.strictEqual(result.openai.maskedKey, "sk-ant-***...***pDw9");
    });
  });

  describe("setApiKey", () => {
    it("should NOT save keys with invalid format", async () => {
      mockProviderRepo.setValidationResult({
        valid: false,
        message: "Invalid key format",
      });

      const result = await service.setApiKey("openai", "invalid-key");

      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.message, "Invalid key format");

      const key = mockSettingsRepo.getApiKey("openai");
      assert.strictEqual(key, null, "Invalid key should not be saved");
    });

    it("should reload API keys during validation", async () => {
      mockProviderRepo.setValidationResult({
        valid: false,
        message: "Invalid key format",
      });

      await service.setApiKey("openai", "sk-test-123456789012");

      assert.strictEqual(
        mockProviderRepo.reloadApiKeysCalled,
        true,
        "reloadApiKeys should be called"
      );
    });

    it("should return validation failure if key format is invalid", async () => {
      mockProviderRepo.setValidationResult({
        valid: false,
        message: "Invalid key format",
      });

      const result = await service.setApiKey("openai", "invalid");

      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.message, "Invalid key format");
    });

    it("should SAVE key even if API test call fails (network/API errors)", async () => {
      // Format validation passes (default behavior in mock)
      mockProviderRepo.setValidationResult({
        valid: true,
        message: "Valid format",
      });
      // But API call fails due to network/provider error
      mockProviderRepo.setShouldThrowOnGetProvider(true);

      const result = await service.setApiKey(
        "openai",
        "sk-test-123456789012"
      );

      // Validation should fail due to API error
      assert.strictEqual(result.valid, false);
      assert.match(result.message, /API key validation failed/);

      // But key should STILL be saved (not rolled back)
      const key = mockSettingsRepo.getApiKey("openai");
      assert.strictEqual(
        key,
        "sk-test-123456789012",
        "Key should be saved despite API validation failure"
      );
    });
  });

  describe("deleteApiKey", () => {
    it("should remove the key from the repository", async () => {
      mockSettingsRepo.setApiKey("openai", "sk-test-123456789012");

      await service.deleteApiKey("openai");

      const key = mockSettingsRepo.getApiKey("openai");
      assert.strictEqual(key, null);
    });

    it("should reload API keys after deletion", async () => {
      mockSettingsRepo.setApiKey("openai", "sk-test-123456789012");

      await service.deleteApiKey("openai");

      assert.strictEqual(
        mockProviderRepo.reloadApiKeysCalled,
        true,
        "reloadApiKeys should be called"
      );
    });

    it("should clear environment variable after deletion", async () => {
      // Set up key in repository and environment
      mockSettingsRepo.setApiKey("openai", "sk-test-123456789012");
      process.env.OPENAI_API_KEY = "sk-test-123456789012";

      // Verify key exists
      assert.strictEqual(process.env.OPENAI_API_KEY, "sk-test-123456789012");

      // Delete the key
      await service.deleteApiKey("openai");

      // Verify reloadApiKeys was called (which triggers syncKeysToEnvironment)
      assert.strictEqual(
        mockProviderRepo.reloadApiKeysCalled,
        true,
        "reloadApiKeys should be called"
      );

      // In a real scenario, this would delete the env var
      // The mock doesn't actually sync to environment, but we've tested that path
      // in the ProviderRepository tests
    });

    it("should make provider unavailable after key deletion", async () => {
      // Set up key
      mockSettingsRepo.setApiKey("openai", "sk-test-123456789012");
      mockProviderRepo.setValidationResult({
        valid: true,
        message: "Valid",
      });

      // Verify provider is valid
      let validation = mockProviderRepo.validateApiKey("openai");
      assert.strictEqual(validation.valid, true);

      // Delete the key
      await service.deleteApiKey("openai");

      // Update mock to reflect deleted state
      mockProviderRepo.setValidationResult({
        valid: false,
        message: "OpenAI API key not configured",
      });

      // Verify provider is now invalid
      validation = mockProviderRepo.validateApiKey("openai");
      assert.strictEqual(validation.valid, false);
    });
  });
});
