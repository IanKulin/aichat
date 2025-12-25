import { test, describe } from "node:test";
import assert from "node:assert";
import { DefaultProviderService } from "../../services/ProviderService.ts";
import { container } from "../../lib/container.ts";

describe("ProviderService Tests", () => {
  let providerService: DefaultProviderService;
  let mockConfigService: any;
  let mockProviderRepository: any;

  const setupService = () => {
    // Create mock ConfigService
    mockConfigService = {
      getProviderConfigs: () => ({
        openai: {
          name: "OpenAI",
          models: ["gpt-4o", "gpt-4o-mini"],
          defaultModel: "gpt-4o-mini",
        },
        anthropic: {
          name: "Anthropic",
          models: ["claude-3-5-haiku-20241022", "claude-3-5-sonnet-20241022"],
          defaultModel: "claude-3-5-haiku-20241022",
        },
        google: {
          name: "Google",
          models: [
            "gemini-2.5-flash-lite",
            "gemini-2.5-flash",
            "gemini-2.5-pro",
          ],
          defaultModel: "gemini-2.5-flash-lite",
        },
        deepseek: {
          name: "DeepSeek",
          models: ["deepseek-chat"],
          defaultModel: "deepseek-chat",
        },
        openrouter: {
          name: "OpenRouter",
          models: ["openrouter/auto"],
          defaultModel: "openrouter/auto",
        },
      }),
      getProviderConfig: (provider: string) => {
        const configs = mockConfigService.getProviderConfigs();
        return configs[provider] || null;
      },
    };

    // Create mock ProviderRepository
    mockProviderRepository = {
      validateApiKey: (provider: string) => {
        const validKeys = {
          openai: { valid: true, message: "OpenAI API key configured" },
          anthropic: {
            valid: false,
            message: "Anthropic API key not configured",
          },
          google: { valid: true, message: "Google API key configured" },
          deepseek: {
            valid: false,
            message: "DeepSeek API key not configured",
          },
          openrouter: {
            valid: false,
            message: "OpenRouter API key not configured",
          },
        };
        return (
          validKeys[provider] || { valid: false, message: "Unknown provider" }
        );
      },
      hasValidApiKey: (provider: string) => {
        return mockProviderRepository.validateApiKey(provider).valid;
      },
      getProvider: (provider: string, model: string) => {
        return { modelId: model, provider: provider };
      },
    };

    // Create service with mocked dependencies
    providerService = new DefaultProviderService(
      mockConfigService,
      mockProviderRepository
    );
  };

  describe("getAvailableProviders() method", () => {
    test("should return providers with valid API keys", () => {
      setupService();

      const available = providerService.getAvailableProviders();

      assert.ok(Array.isArray(available));
      assert.ok(available.includes("openai"));
      assert.ok(available.includes("google"));
      assert.ok(!available.includes("anthropic")); // No valid API key
    });

    test("should return empty array when no valid API keys", () => {
      setupService();

      // Override mock to return all invalid
      mockProviderRepository.validateApiKey = () => ({
        valid: false,
        message: "No API key",
      });

      const available = providerService.getAvailableProviders();

      assert.ok(Array.isArray(available));
      assert.strictEqual(available.length, 0);
    });
  });

  describe("getProviderInfo() method", () => {
    test("should return provider information", () => {
      setupService();

      const info = providerService.getProviderInfo();

      assert.ok(Array.isArray(info));
      // Only providers with valid API keys are returned (openai and google from our mock)
      assert.strictEqual(info.length, 2);

      const openaiInfo = info.find((p) => p.id === "openai");
      assert.ok(openaiInfo);
      assert.strictEqual(openaiInfo.name, "OpenAI");
      assert.ok(Array.isArray(openaiInfo.models));
      assert.strictEqual(openaiInfo.defaultModel, "gpt-4o-mini");

      const googleInfo = info.find((p) => p.id === "google");
      assert.ok(googleInfo);
      assert.strictEqual(googleInfo.name, "Google");
      assert.ok(Array.isArray(googleInfo.models));
      assert.strictEqual(googleInfo.defaultModel, "gemini-2.5-flash-lite");

      // Anthropic is not included because it doesn't have a valid API key
      const anthropicInfo = info.find((p) => p.id === "anthropic");
      assert.ok(
        !anthropicInfo,
        "Anthropic should not be included without valid API key"
      );
    });

    test("should handle empty provider configs", () => {
      setupService();

      // Override mock to return empty configs and no valid API keys
      mockConfigService.getProviderConfigs = () => ({});
      mockProviderRepository.validateApiKey = () => ({
        valid: false,
        message: "No config",
      });

      const info = providerService.getProviderInfo();

      assert.ok(Array.isArray(info));
      assert.strictEqual(info.length, 0);
    });
  });

  describe("validateProvider() method", () => {
    test("should validate available providers only", () => {
      setupService();

      // Only openai and google have valid API keys in our mock
      assert.strictEqual(providerService.validateProvider("openai"), true);
      assert.strictEqual(providerService.validateProvider("anthropic"), false); // No valid API key
      assert.strictEqual(providerService.validateProvider("google"), true);
    });

    test("should reject unknown providers", () => {
      setupService();

      assert.strictEqual(providerService.validateProvider("unknown"), false);
      assert.strictEqual(providerService.validateProvider("invalid"), false);
      assert.strictEqual(providerService.validateProvider(""), false);
    });

    test("should handle null/undefined provider", () => {
      setupService();

      assert.strictEqual(providerService.validateProvider(null as any), false);
      assert.strictEqual(
        providerService.validateProvider(undefined as any),
        false
      );
    });
  });

  describe("getProviderModel() method", () => {
    test("should return provider model", () => {
      setupService();

      const model = providerService.getProviderModel("openai", "gpt-4o-mini");

      assert.ok(model);
      assert.strictEqual(model.modelId, "gpt-4o-mini");
      assert.strictEqual(model.provider, "openai");
    });

    test("should handle different providers", () => {
      setupService();

      const anthropicModel = providerService.getProviderModel(
        "anthropic",
        "claude-3-5-haiku-20241022"
      );
      assert.ok(anthropicModel);
      assert.strictEqual(anthropicModel.modelId, "claude-3-5-haiku-20241022");

      const googleModel = providerService.getProviderModel(
        "google",
        "gemini-2.5-flash-lite"
      );
      assert.ok(googleModel);
      assert.strictEqual(googleModel.modelId, "gemini-2.5-flash-lite");
    });
  });

  describe("validateApiKey() method", () => {
    test("should validate API keys", () => {
      setupService();

      const openaiResult = providerService.validateApiKey("openai");
      assert.strictEqual(openaiResult.valid, true);
      assert.strictEqual(openaiResult.message, "OpenAI API key configured");

      const anthropicResult = providerService.validateApiKey("anthropic");
      assert.strictEqual(anthropicResult.valid, false);
      assert.strictEqual(
        anthropicResult.message,
        "Anthropic API key not configured"
      );

      const googleResult = providerService.validateApiKey("google");
      assert.strictEqual(googleResult.valid, true);
      assert.strictEqual(googleResult.message, "Google API key configured");
    });

    test("should handle unknown providers", () => {
      setupService();

      const result = providerService.validateApiKey("unknown" as any);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.message, "Unknown provider");
    });
  });

  describe("validateAllProviders() method", () => {
    test("should validate all configured providers", () => {
      setupService();

      const results = providerService.validateAllProviders();

      assert.ok(typeof results === "object");
      assert.ok("openai" in results);
      assert.ok("anthropic" in results);
      assert.ok("google" in results);
      assert.ok("deepseek" in results);
      assert.ok("openrouter" in results);

      assert.strictEqual(results.openai.valid, true);
      assert.strictEqual(results.anthropic.valid, false);
      assert.strictEqual(results.google.valid, true);
      assert.strictEqual(results.deepseek.valid, false);
      assert.strictEqual(results.openrouter.valid, false);

      assert.ok(results.openai.message);
      assert.ok(results.anthropic.message);
      assert.ok(results.google.message);
    });

    test("should validate all supported providers regardless of config", () => {
      setupService();

      // Even with empty configs, validates all supported providers
      mockConfigService.getProviderConfigs = () => ({});

      const results = providerService.validateAllProviders();

      assert.ok(typeof results === "object");
      // All 5 supported providers should be checked
      assert.strictEqual(Object.keys(results).length, 5);
      assert.ok("openai" in results);
      assert.ok("anthropic" in results);
      assert.ok("google" in results);
      assert.ok("deepseek" in results);
      assert.ok("openrouter" in results);
    });
  });

  describe("Integration with DI Container", () => {
    test("should be resolvable from DI container", async () => {
      await import("../../lib/services.ts"); // Initialize DI container
      const service =
        container.resolve<DefaultProviderService>("ProviderService");

      assert.ok(service);
      assert.ok(typeof service.getAvailableProviders === "function");
      assert.ok(typeof service.getProviderInfo === "function");
      assert.ok(typeof service.validateProvider === "function");
      assert.ok(typeof service.validateApiKey === "function");
      assert.ok(typeof service.validateAllProviders === "function");
      assert.ok(typeof service.getProviderModel === "function");
    });
  });
});
