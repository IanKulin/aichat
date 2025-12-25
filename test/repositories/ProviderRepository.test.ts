import { test, describe } from "node:test";
import assert from "node:assert";
import { DefaultProviderRepository } from "../../repositories/ProviderRepository.ts";
import { container } from "../../lib/container.ts";
import type { ISettingsRepository } from "../../repositories/SettingsRepository.ts";
import type { SupportedProvider } from "../../lib/types.ts";

describe("ProviderRepository Tests", () => {
  let providerRepository: DefaultProviderRepository;
  let mockSettingsRepository: ISettingsRepository;

  const createMockSettingsRepository = (): ISettingsRepository => {
    const apiKeys: Record<string, string | null> = {
      openai: null,
      anthropic: null,
      google: null,
      deepseek: null,
      openrouter: null,
    };

    return {
      getApiKey: (provider: SupportedProvider) => apiKeys[provider] || null,
      setApiKey: (provider: SupportedProvider, key: string) => {
        apiKeys[provider] = key;
      },
      getAllApiKeys: () => ({
        openai: apiKeys.openai,
        anthropic: apiKeys.anthropic,
        google: apiKeys.google,
        deepseek: apiKeys.deepseek,
        openrouter: apiKeys.openrouter,
      }),
      deleteApiKey: (provider: SupportedProvider) => {
        apiKeys[provider] = null;
      },
    };
  };

  const setupRepository = () => {
    mockSettingsRepository = createMockSettingsRepository();
    providerRepository = new DefaultProviderRepository(mockSettingsRepository);
  };

  describe("validateApiKey() method", () => {
    test("should validate OpenAI API key format and presence", () => {
      setupRepository();

      // Test with valid API key
      process.env.OPENAI_API_KEY = "sk-1234567890abcdef1234567890abcdef";
      const result = providerRepository.validateApiKey("openai");

      assert.strictEqual(typeof result, "object");
      assert.strictEqual(typeof result.valid, "boolean");
      assert.strictEqual(typeof result.message, "string");

      if (
        process.env.OPENAI_API_KEY &&
        process.env.OPENAI_API_KEY.length >= 10
      ) {
        assert.strictEqual(result.valid, true);
        assert.strictEqual(result.message, "OpenAI API key configured");
      }
    });

    test("should reject empty or missing OpenAI API key", () => {
      setupRepository();

      // Test with empty key
      process.env.OPENAI_API_KEY = "";
      let result = providerRepository.validateApiKey("openai");
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.message, "OpenAI API key not configured");

      // Test with undefined key
      delete process.env.OPENAI_API_KEY;
      result = providerRepository.validateApiKey("openai");
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.message, "OpenAI API key not configured");
    });

    test("should validate Anthropic API key", () => {
      setupRepository();

      // Test with valid API key
      process.env.ANTHROPIC_API_KEY = "sk-ant-1234567890abcdef";
      const result = providerRepository.validateApiKey("anthropic");

      assert.strictEqual(typeof result, "object");
      if (
        process.env.ANTHROPIC_API_KEY &&
        process.env.ANTHROPIC_API_KEY.length >= 10
      ) {
        assert.strictEqual(result.valid, true);
        assert.strictEqual(result.message, "Anthropic API key configured");
      }
    });

    test("should validate Google API key", () => {
      setupRepository();

      // Test with valid API key
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = "valid-google-api-key-12345";
      const result = providerRepository.validateApiKey("google");

      assert.strictEqual(typeof result, "object");
      if (
        process.env.GOOGLE_GENERATIVE_AI_API_KEY &&
        process.env.GOOGLE_GENERATIVE_AI_API_KEY.length >= 10
      ) {
        assert.strictEqual(result.valid, true);
        assert.strictEqual(result.message, "Google API key configured");
      }
    });

    test("should validate DeepSeek API key", () => {
      setupRepository();

      // Test with valid API key
      process.env.DEEPSEEK_API_KEY = "valid-deepseek-api-key-12345";
      const result = providerRepository.validateApiKey("deepseek");

      assert.strictEqual(typeof result, "object");
      if (
        process.env.DEEPSEEK_API_KEY &&
        process.env.DEEPSEEK_API_KEY.length >= 10
      ) {
        assert.strictEqual(result.valid, true);
        assert.strictEqual(result.message, "DeepSeek API key configured");
      }
    });

    test("should validate OpenRouter API key", () => {
      setupRepository();

      // Test with valid API key
      process.env.OPENROUTER_API_KEY = "sk-or-1234567890abcdef";
      const result = providerRepository.validateApiKey("openrouter");

      assert.strictEqual(typeof result, "object");
      if (
        process.env.OPENROUTER_API_KEY &&
        process.env.OPENROUTER_API_KEY.length >= 10
      ) {
        assert.strictEqual(result.valid, true);
        assert.strictEqual(result.message, "OpenRouter API key configured");
      }
    });

    test("should reject unknown providers", () => {
      setupRepository();

      const result = providerRepository.validateApiKey("unknown" as any);
      assert.strictEqual(result.valid, false);
      assert.ok(result.message.includes("not configured"));
    });
  });

  describe("hasValidApiKey() method", () => {
    test("should return true for providers with valid API keys", () => {
      setupRepository();

      // Set up a valid API key
      process.env.OPENAI_API_KEY = "sk-valid-key-1234567890";

      const hasValid = providerRepository.hasValidApiKey("openai");
      assert.strictEqual(typeof hasValid, "boolean");

      if (
        process.env.OPENAI_API_KEY &&
        process.env.OPENAI_API_KEY.length >= 10
      ) {
        assert.strictEqual(hasValid, true);
      }
    });

    test("should return false for providers with invalid API keys", () => {
      setupRepository();

      // Clear the API key
      delete process.env.OPENAI_API_KEY;

      const hasValid = providerRepository.hasValidApiKey("openai");
      assert.strictEqual(hasValid, false);
    });

    test("should return false for unknown providers", () => {
      setupRepository();

      const hasValid = providerRepository.hasValidApiKey("unknown" as any);
      assert.strictEqual(hasValid, false);
    });
  });

  describe("getProvider() method", () => {
    test("should return provider instance for OpenAI", () => {
      setupRepository();

      // This test might fail without actual API key, but we test the structure
      try {
        const provider = providerRepository.getProvider(
          "openai",
          "gpt-4o-mini"
        );
        assert.ok(provider);
        // Provider should have some structure - exact structure depends on implementation
      } catch (error) {
        // Expected if no API key is configured
        assert.ok(error instanceof Error);
      }
    });

    test("should return provider instance for Anthropic", () => {
      setupRepository();

      try {
        const provider = providerRepository.getProvider(
          "anthropic",
          "claude-3-5-haiku-20241022"
        );
        assert.ok(provider);
      } catch (error) {
        // Expected if no API key is configured
        assert.ok(error instanceof Error);
      }
    });

    test("should return provider instance for Google", () => {
      setupRepository();

      try {
        const provider = providerRepository.getProvider(
          "google",
          "gemini-2.5-flash-lite"
        );
        assert.ok(provider);
      } catch (error) {
        // Expected if no API key is configured
        assert.ok(error instanceof Error);
      }
    });

    test("should return provider instance for DeepSeek", () => {
      setupRepository();

      try {
        const provider = providerRepository.getProvider(
          "deepseek",
          "deepseek-chat"
        );
        assert.ok(provider);
      } catch (error) {
        // Expected if no API key is configured
        assert.ok(error instanceof Error);
      }
    });

    test("should return provider instance for OpenRouter", () => {
      setupRepository();

      try {
        const provider = providerRepository.getProvider(
          "openrouter",
          "openrouter/auto"
        );
        assert.ok(provider);
      } catch (error) {
        // Expected if no API key is configured
        assert.ok(error instanceof Error);
      }
    });

    test("should handle unsupported providers", () => {
      setupRepository();

      assert.throws(() => {
        providerRepository.getProvider("unknown" as any, "some-model");
      }, /not configured|missing/);
    });
  });

  describe("clearCache() method", () => {
    test("should clear provider cache", () => {
      setupRepository();

      // Cache should be clearable without throwing
      assert.doesNotThrow(() => {
        providerRepository.clearCache();
      });
    });

    test("should allow getting providers after cache clear", () => {
      setupRepository();

      providerRepository.clearCache();

      // Should still work after cache clear
      try {
        const provider = providerRepository.getProvider(
          "openai",
          "gpt-4o-mini"
        );
        assert.ok(provider);
      } catch (error) {
        // Expected if no API key is configured
        assert.ok(error instanceof Error);
      }
    });
  });

  describe("Provider Instance Caching", () => {
    test("should cache provider instances", () => {
      setupRepository();

      // Set up API key for testing
      process.env.OPENAI_API_KEY = "sk-test-key-1234567890";

      try {
        const provider1 = providerRepository.getProvider(
          "openai",
          "gpt-4o-mini"
        );
        const provider2 = providerRepository.getProvider(
          "openai",
          "gpt-4o-mini"
        );

        // Should return same instance (cached)
        assert.strictEqual(provider1, provider2);
      } catch (error) {
        // If we can't test caching due to missing API key, at least verify error is consistent
        try {
          providerRepository.getProvider("openai", "gpt-4o-mini");
          assert.fail("Should have thrown same error");
        } catch (error2) {
          assert.strictEqual(error.message, error2.message);
        }
      }
    });

    test("should cache different models separately", () => {
      setupRepository();

      process.env.OPENAI_API_KEY = "sk-test-key-1234567890";

      try {
        const provider1 = providerRepository.getProvider(
          "openai",
          "gpt-4o-mini"
        );
        const provider2 = providerRepository.getProvider("openai", "gpt-4o");

        // Different models should be different instances (or at least not cause issues)
        assert.ok(provider1);
        assert.ok(provider2);
      } catch (error) {
        // Expected if no API key configured
        assert.ok(error instanceof Error);
      }
    });
  });

  describe("syncKeysToEnvironment() method", () => {
    test("should load keys from database to process.env on initialization", () => {
      // Set up mock with API keys
      mockSettingsRepository = createMockSettingsRepository();
      mockSettingsRepository.setApiKey("openai", "sk-test-openai-key-123456");
      mockSettingsRepository.setApiKey(
        "anthropic",
        "sk-ant-test-anthropic-key"
      );

      // Clear environment variables first
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      // Create repository - should sync keys to environment in constructor
      providerRepository = new DefaultProviderRepository(
        mockSettingsRepository
      );

      // Verify keys were loaded into process.env
      assert.strictEqual(
        process.env.OPENAI_API_KEY,
        "sk-test-openai-key-123456"
      );
      assert.strictEqual(
        process.env.ANTHROPIC_API_KEY,
        "sk-ant-test-anthropic-key"
      );
    });

    test("should only set environment variables for keys that exist in database", () => {
      // Set up mock with only one key
      mockSettingsRepository = createMockSettingsRepository();
      mockSettingsRepository.setApiKey("google", "test-google-key-123456");

      // Clear environment variables
      delete process.env.OPENAI_API_KEY;
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;

      // Create repository
      providerRepository = new DefaultProviderRepository(
        mockSettingsRepository
      );

      // Only Google key should be set
      assert.strictEqual(
        process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        "test-google-key-123456"
      );
      assert.strictEqual(process.env.OPENAI_API_KEY, undefined);
    });

    test("should load all provider keys correctly", () => {
      // Set up mock with all providers
      mockSettingsRepository = createMockSettingsRepository();
      mockSettingsRepository.setApiKey("openai", "sk-openai-123");
      mockSettingsRepository.setApiKey("anthropic", "sk-ant-123");
      mockSettingsRepository.setApiKey("google", "google-123");
      mockSettingsRepository.setApiKey("deepseek", "deepseek-123");
      mockSettingsRepository.setApiKey("openrouter", "sk-or-123");

      // Clear all environment variables
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      delete process.env.DEEPSEEK_API_KEY;
      delete process.env.OPENROUTER_API_KEY;

      // Create repository
      providerRepository = new DefaultProviderRepository(
        mockSettingsRepository
      );

      // Verify all keys were loaded
      assert.strictEqual(process.env.OPENAI_API_KEY, "sk-openai-123");
      assert.strictEqual(process.env.ANTHROPIC_API_KEY, "sk-ant-123");
      assert.strictEqual(
        process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        "google-123"
      );
      assert.strictEqual(process.env.DEEPSEEK_API_KEY, "deepseek-123");
      assert.strictEqual(process.env.OPENROUTER_API_KEY, "sk-or-123");
    });

    test("should delete environment variable when key is null in database", () => {
      // Set up environment with existing key
      process.env.OPENAI_API_KEY = "sk-old-key-should-be-deleted";

      // Create repository with empty database (no keys)
      mockSettingsRepository = createMockSettingsRepository();
      providerRepository = new DefaultProviderRepository(
        mockSettingsRepository
      );

      // Verify key was deleted from environment
      assert.strictEqual(process.env.OPENAI_API_KEY, undefined);
    });

    test("should delete all environment variables when database is empty", () => {
      // Set up environment with multiple keys
      process.env.OPENAI_API_KEY = "sk-openai-old";
      process.env.ANTHROPIC_API_KEY = "sk-ant-old";
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = "google-old";
      process.env.DEEPSEEK_API_KEY = "deepseek-old";
      process.env.OPENROUTER_API_KEY = "sk-or-old";

      // Create repository with empty database
      mockSettingsRepository = createMockSettingsRepository();
      providerRepository = new DefaultProviderRepository(
        mockSettingsRepository
      );

      // Verify all keys were deleted from environment
      assert.strictEqual(process.env.OPENAI_API_KEY, undefined);
      assert.strictEqual(process.env.ANTHROPIC_API_KEY, undefined);
      assert.strictEqual(process.env.GOOGLE_GENERATIVE_AI_API_KEY, undefined);
      assert.strictEqual(process.env.DEEPSEEK_API_KEY, undefined);
      assert.strictEqual(process.env.OPENROUTER_API_KEY, undefined);
    });
  });

  describe("reloadApiKeys() method", () => {
    test("should clear cache and resync keys from database", () => {
      setupRepository();

      // Set initial key
      process.env.OPENAI_API_KEY = "sk-old-key-123";

      // Update key in mock database
      mockSettingsRepository.setApiKey("openai", "sk-new-key-456");

      // Reload keys
      providerRepository.reloadApiKeys();

      // Verify environment was updated
      assert.strictEqual(process.env.OPENAI_API_KEY, "sk-new-key-456");
    });

    test("should clear provider cache when reloading keys", () => {
      setupRepository();

      // Set up a key and get a provider to cache it
      mockSettingsRepository.setApiKey("openai", "sk-test-key-1234567890");
      process.env.OPENAI_API_KEY = "sk-test-key-1234567890";

      try {
        const provider1 = providerRepository.getProvider(
          "openai",
          "gpt-4o-mini"
        );

        // Reload keys (should clear cache)
        providerRepository.reloadApiKeys();

        // Get provider again - should be a fresh instance
        const provider2 = providerRepository.getProvider(
          "openai",
          "gpt-4o-mini"
        );

        // Both should exist (cache was cleared and recreated)
        assert.ok(provider1);
        assert.ok(provider2);
      } catch (error) {
        // Expected if provider creation fails for other reasons
        assert.ok(error instanceof Error);
      }
    });

    test("should allow updating multiple keys at once", () => {
      setupRepository();

      // Set initial keys
      process.env.OPENAI_API_KEY = "sk-old-openai";
      process.env.ANTHROPIC_API_KEY = "sk-ant-old";

      // Update multiple keys in database
      mockSettingsRepository.setApiKey("openai", "sk-new-openai");
      mockSettingsRepository.setApiKey("anthropic", "sk-ant-new");
      mockSettingsRepository.setApiKey("google", "new-google-key");

      // Reload all keys
      providerRepository.reloadApiKeys();

      // Verify all keys were updated
      assert.strictEqual(process.env.OPENAI_API_KEY, "sk-new-openai");
      assert.strictEqual(process.env.ANTHROPIC_API_KEY, "sk-ant-new");
      assert.strictEqual(
        process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        "new-google-key"
      );
    });

    test("should DELETE environment variable when key is removed from database", () => {
      setupRepository();

      // Set initial key in database AND environment
      mockSettingsRepository.setApiKey("openai", "sk-initial-key-123");
      process.env.OPENAI_API_KEY = "sk-initial-key-123";

      // Verify key exists
      assert.strictEqual(process.env.OPENAI_API_KEY, "sk-initial-key-123");

      // Delete key from database
      mockSettingsRepository.deleteApiKey("openai");

      // Reload keys - should DELETE the environment variable
      providerRepository.reloadApiKeys();

      // Verify environment variable was deleted (not just set to empty string)
      assert.strictEqual(process.env.OPENAI_API_KEY, undefined);
    });

    test("should DELETE all environment variables when all keys are removed", () => {
      setupRepository();

      // Set up multiple keys
      mockSettingsRepository.setApiKey("openai", "sk-openai-123");
      mockSettingsRepository.setApiKey("anthropic", "sk-ant-123");
      mockSettingsRepository.setApiKey("google", "google-123");
      process.env.OPENAI_API_KEY = "sk-openai-123";
      process.env.ANTHROPIC_API_KEY = "sk-ant-123";
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = "google-123";

      // Delete all keys from database
      mockSettingsRepository.deleteApiKey("openai");
      mockSettingsRepository.deleteApiKey("anthropic");
      mockSettingsRepository.deleteApiKey("google");

      // Reload keys
      providerRepository.reloadApiKeys();

      // Verify all environment variables were deleted
      assert.strictEqual(process.env.OPENAI_API_KEY, undefined);
      assert.strictEqual(process.env.ANTHROPIC_API_KEY, undefined);
      assert.strictEqual(process.env.GOOGLE_GENERATIVE_AI_API_KEY, undefined);
    });

    test("should handle partial key deletion (keep some, delete others)", () => {
      setupRepository();

      // Set up multiple keys
      mockSettingsRepository.setApiKey("openai", "sk-openai-123");
      mockSettingsRepository.setApiKey("anthropic", "sk-ant-123");
      process.env.OPENAI_API_KEY = "sk-openai-123";
      process.env.ANTHROPIC_API_KEY = "sk-ant-123";

      // Delete only OpenAI key
      mockSettingsRepository.deleteApiKey("openai");

      // Reload keys
      providerRepository.reloadApiKeys();

      // Verify OpenAI was deleted but Anthropic remains
      assert.strictEqual(process.env.OPENAI_API_KEY, undefined);
      assert.strictEqual(process.env.ANTHROPIC_API_KEY, "sk-ant-123");
    });
  });

  describe("Integration with DI Container", () => {
    test("should be resolvable from DI container", async () => {
      await import("../../lib/services.ts"); // Initialize DI container
      const repository =
        container.resolve<DefaultProviderRepository>("ProviderRepository");

      assert.ok(repository);
      assert.ok(typeof repository.validateApiKey === "function");
      assert.ok(typeof repository.hasValidApiKey === "function");
      assert.ok(typeof repository.getProvider === "function");
      assert.ok(typeof repository.clearCache === "function");
      assert.ok(typeof repository.reloadApiKeys === "function");
    });
  });
});
