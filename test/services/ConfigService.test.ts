import { test, describe } from "node:test";
import assert from "node:assert";
import { DefaultConfigService } from "../../services/ConfigService.ts";
import { container } from "../../lib/container.ts";

describe("ConfigService Tests", () => {
  let configService: DefaultConfigService;
  let mockModelRepository: any;

  const setupService = () => {
    // Create mock ModelRepository
    mockModelRepository = {
      loadModelsConfig: () => ({
        openai: {
          name: "OpenAI",
          models: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
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
      }),
      validateModelsConfig: (data: any) => {
        // Simple validation - check if data is an object
        return typeof data === "object" && data !== null;
      },
    };

    // Create service with mocked dependencies
    configService = new DefaultConfigService(mockModelRepository);
  };

  describe("getProviderConfigs() method", () => {
    test("should return all provider configurations", () => {
      setupService();

      const configs = configService.getProviderConfigs();

      assert.ok(typeof configs === "object");
      assert.ok("openai" in configs);
      assert.ok("anthropic" in configs);
      assert.ok("google" in configs);
      assert.ok("deepseek" in configs);

      // Verify structure of a config
      const openaiConfig = configs.openai;
      assert.strictEqual(openaiConfig.name, "OpenAI");
      assert.ok(Array.isArray(openaiConfig.models));
      assert.ok(openaiConfig.models.length > 0);
      assert.strictEqual(openaiConfig.defaultModel, "gpt-4o-mini");
      assert.ok(openaiConfig.models.includes(openaiConfig.defaultModel));
    });

    test("should handle empty configurations", () => {
      setupService();

      // Override mock to return empty config
      mockModelRepository.loadModelsConfig = () => ({});
      configService = new DefaultConfigService(mockModelRepository);

      const configs = configService.getProviderConfigs();

      assert.ok(typeof configs === "object");
      assert.strictEqual(Object.keys(configs).length, 0);
    });
  });

  describe("getProviderConfig() method", () => {
    test("should return specific provider configuration", () => {
      setupService();

      const openaiConfig = configService.getProviderConfig("openai");

      assert.ok(openaiConfig);
      assert.strictEqual(openaiConfig.name, "OpenAI");
      assert.ok(Array.isArray(openaiConfig.models));
      assert.strictEqual(openaiConfig.defaultModel, "gpt-4o-mini");
      assert.ok(openaiConfig.models.includes("gpt-4o-mini"));
      assert.ok(openaiConfig.models.includes("gpt-4o"));
    });

    test("should return configurations for all supported providers", () => {
      setupService();

      const providers = ["openai", "anthropic", "google", "deepseek"];

      providers.forEach((provider) => {
        const config = configService.getProviderConfig(provider as any);
        assert.ok(config, `Config should exist for ${provider}`);
        assert.ok(config.name, `Name should exist for ${provider}`);
        assert.ok(
          Array.isArray(config.models),
          `Models should be array for ${provider}`
        );
        assert.ok(
          config.defaultModel,
          `Default model should exist for ${provider}`
        );
        assert.ok(
          config.models.includes(config.defaultModel),
          `Default model should be in models array for ${provider}`
        );
      });
    });

    test("should throw error for unknown provider", () => {
      setupService();

      assert.throws(() => {
        configService.getProviderConfig("unknown" as any);
      }, /Configuration not found for provider: unknown/);
    });

    test("should throw error for null/undefined provider", () => {
      setupService();

      assert.throws(() => {
        configService.getProviderConfig(null as any);
      }, /Configuration not found/);

      assert.throws(() => {
        configService.getProviderConfig(undefined as any);
      }, /Configuration not found/);
    });
  });

  describe("validateConfiguration() method", () => {
    test("should validate configuration successfully", () => {
      setupService();

      // Should not throw for valid configuration
      assert.doesNotThrow(() => {
        configService.validateConfiguration();
      });
    });

    test("should call repository validation", () => {
      setupService();

      let validateCalled = false;
      let validatedData: any = null;

      mockModelRepository.validateModelsConfig = (data: any) => {
        validateCalled = true;
        validatedData = data;
        return true;
      };

      configService.validateConfiguration();

      assert.ok(validateCalled);
      assert.ok(validatedData);
      assert.ok("openai" in validatedData);
      assert.ok("anthropic" in validatedData);
    });

    test("should handle validation errors", () => {
      setupService();

      // Override mock to throw error
      mockModelRepository.validateModelsConfig = () => {
        throw new Error("Invalid configuration");
      };

      assert.throws(() => {
        configService.validateConfiguration();
      }, /Invalid configuration/);
    });
  });

  describe("Configuration Loading and Caching", () => {
    test("should load configuration during construction", () => {
      let loadCalled = false;

      const testRepository = {
        loadModelsConfig: () => {
          loadCalled = true;
          return {
            test: {
              name: "Test",
              models: ["test-model"],
              defaultModel: "test-model",
            },
          };
        },
        validateModelsConfig: () => true,
      };

      const service = new DefaultConfigService(testRepository);

      assert.ok(loadCalled);

      const configs = service.getProviderConfigs();
      assert.ok("test" in configs);
    });

    test("should cache configuration after loading", () => {
      let loadCallCount = 0;

      const testRepository = {
        loadModelsConfig: () => {
          loadCallCount++;
          return {
            test: {
              name: "Test",
              models: ["test-model"],
              defaultModel: "test-model",
            },
          };
        },
        validateModelsConfig: () => true,
      };

      const service = new DefaultConfigService(testRepository);

      // Call multiple times
      service.getProviderConfigs();
      service.getProviderConfigs();
      service.getProviderConfig("test" as any);

      // Should only load once during construction
      assert.strictEqual(loadCallCount, 1);
    });
  });

  describe("Integration with DI Container", () => {
    test("should be resolvable from DI container", async () => {
      await import("../../lib/services.ts"); // Initialize DI container
      const service = container.resolve<DefaultConfigService>("ConfigService");

      assert.ok(service);
      assert.ok(typeof service.getProviderConfigs === "function");
      assert.ok(typeof service.getProviderConfig === "function");
      assert.ok(typeof service.validateConfiguration === "function");
    });
  });
});
