import { test, describe } from "node:test";
import assert from "node:assert";
import { FileModelRepository } from "../../repositories/ModelRepository.ts";
import { container } from "../../lib/container.ts";

describe("ModelRepository Tests", () => {
  let modelRepository: FileModelRepository;

  const setupRepository = () => {
    modelRepository = new FileModelRepository();
  };

  describe("loadModelsConfig() method", () => {
    test("should load models configuration from file", () => {
      setupRepository();

      const config = modelRepository.loadModelsConfig();

      assert.ok(typeof config === "object");
      assert.ok(config !== null);

      // Should have standard providers
      assert.ok("openai" in config);
      assert.ok("anthropic" in config);
      assert.ok("google" in config);
      assert.ok("deepseek" in config);
    });

    test("should return valid config structure", () => {
      setupRepository();

      const config = modelRepository.loadModelsConfig();

      // Test structure of each provider config
      Object.entries(config).forEach(([providerId, providerConfig]) => {
        assert.ok(
          typeof providerConfig === "object",
          `Config for ${providerId} should be object`
        );
        assert.ok(
          "name" in providerConfig,
          `Config for ${providerId} should have name`
        );
        assert.ok(
          "models" in providerConfig,
          `Config for ${providerId} should have models`
        );
        assert.ok(
          "defaultModel" in providerConfig,
          `Config for ${providerId} should have defaultModel`
        );

        assert.ok(
          typeof providerConfig.name === "string",
          `Name for ${providerId} should be string`
        );
        assert.ok(
          Array.isArray(providerConfig.models),
          `Models for ${providerId} should be array`
        );
        assert.ok(
          typeof providerConfig.defaultModel === "string",
          `Default model for ${providerId} should be string`
        );

        // Default model should be in models array
        assert.ok(
          providerConfig.models.includes(providerConfig.defaultModel),
          `Default model for ${providerId} should be in models array`
        );
      });
    });

    test("should have consistent provider data", () => {
      setupRepository();

      const config = modelRepository.loadModelsConfig();

      // Test OpenAI specifically
      if ("openai" in config) {
        const openaiConfig = config.openai;
        assert.strictEqual(openaiConfig.name, "OpenAI");
        assert.ok(openaiConfig.models.length > 0);
        assert.ok(openaiConfig.models.includes("gpt-4o-mini"));
        assert.strictEqual(openaiConfig.defaultModel, "gpt-4o-mini");
      }

      // Test Anthropic specifically
      if ("anthropic" in config) {
        const anthropicConfig = config.anthropic;
        assert.strictEqual(anthropicConfig.name, "Anthropic");
        assert.ok(anthropicConfig.models.length > 0);
        assert.ok(
          anthropicConfig.models.some((model) => model.includes("claude"))
        );
      }
    });

    test("should cache config after first load", () => {
      setupRepository();

      const config1 = modelRepository.loadModelsConfig();
      const config2 = modelRepository.loadModelsConfig();

      // Should return the same object reference (cached)
      assert.strictEqual(config1, config2);
    });
  });

  describe("validateModelsConfig() method", () => {
    test("should validate correct configuration structure", () => {
      setupRepository();

      const validConfig = {
        openai: {
          name: "OpenAI",
          models: ["gpt-4o-mini", "gpt-4o"],
          defaultModel: "gpt-4o-mini",
        },
        anthropic: {
          name: "Anthropic",
          models: ["claude-3-5-haiku-20241022"],
          defaultModel: "claude-3-5-haiku-20241022",
        },
        google: {
          name: "Google",
          models: ["gemini-2.5-flash-lite"],
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
      };

      const result = modelRepository.validateModelsConfig(validConfig);
      assert.strictEqual(result, true);
    });

    test("should reject invalid configuration structures", () => {
      setupRepository();

      // Test null/undefined - should throw
      assert.throws(() => {
        modelRepository.validateModelsConfig(null as any);
      });

      assert.throws(() => {
        modelRepository.validateModelsConfig(undefined as any);
      });

      // Test non-object - should throw
      assert.throws(() => {
        modelRepository.validateModelsConfig("string" as any);
      });

      assert.throws(() => {
        modelRepository.validateModelsConfig(123 as any);
      });

      assert.throws(() => {
        modelRepository.validateModelsConfig([] as any);
      });
    });

    test("should reject providers with missing required fields", () => {
      setupRepository();

      // Missing name - should throw
      const configMissingName = {
        openai: {
          models: ["gpt-4o-mini"],
          defaultModel: "gpt-4o-mini",
        },
        anthropic: {
          name: "Anthropic",
          models: ["claude"],
          defaultModel: "claude",
        },
        google: { name: "Google", models: ["gemini"], defaultModel: "gemini" },
        deepseek: {
          name: "DeepSeek",
          models: ["deepseek"],
          defaultModel: "deepseek",
        },
        openrouter: {
          name: "OpenRouter",
          models: ["openrouter"],
          defaultModel: "openrouter",
        },
      };
      assert.throws(() => {
        modelRepository.validateModelsConfig(configMissingName);
      }, /Invalid configuration for provider: openai/);
    });

    test("should reject providers with falsy values", () => {
      setupRepository();

      // Invalid name (falsy) - should throw
      const configInvalidName = {
        openai: {
          name: "", // Empty string is falsy
          models: ["gpt-4o-mini"],
          defaultModel: "gpt-4o-mini",
        },
        anthropic: {
          name: "Anthropic",
          models: ["claude"],
          defaultModel: "claude",
        },
        google: { name: "Google", models: ["gemini"], defaultModel: "gemini" },
        deepseek: {
          name: "DeepSeek",
          models: ["deepseek"],
          defaultModel: "deepseek",
        },
        openrouter: {
          name: "OpenRouter",
          models: ["openrouter"],
          defaultModel: "openrouter",
        },
      };
      assert.throws(() => {
        modelRepository.validateModelsConfig(configInvalidName);
      }, /Invalid configuration for provider: openai/);

      // Invalid models (not array)
      const configInvalidModels = {
        openai: {
          name: "OpenAI",
          models: "not-array", // Not array
          defaultModel: "gpt-4o-mini",
        },
        anthropic: {
          name: "Anthropic",
          models: ["claude"],
          defaultModel: "claude",
        },
        google: { name: "Google", models: ["gemini"], defaultModel: "gemini" },
        deepseek: {
          name: "DeepSeek",
          models: ["deepseek"],
          defaultModel: "deepseek",
        },
        openrouter: {
          name: "OpenRouter",
          models: ["openrouter"],
          defaultModel: "openrouter",
        },
      };
      assert.throws(() => {
        modelRepository.validateModelsConfig(configInvalidModels);
      }, /Invalid configuration for provider: openai/);
    });

    test("should reject providers with empty models array", () => {
      setupRepository();

      const configEmptyModels = {
        openai: {
          name: "OpenAI",
          models: [], // Empty array
          defaultModel: "gpt-4o-mini",
        },
        anthropic: {
          name: "Anthropic",
          models: ["claude"],
          defaultModel: "claude",
        },
        google: { name: "Google", models: ["gemini"], defaultModel: "gemini" },
        deepseek: {
          name: "DeepSeek",
          models: ["deepseek"],
          defaultModel: "deepseek",
        },
        openrouter: {
          name: "OpenRouter",
          models: ["openrouter"],
          defaultModel: "openrouter",
        },
      };
      assert.throws(() => {
        modelRepository.validateModelsConfig(configEmptyModels);
      }, /Default model gpt-4o-mini not in models list for openai/);
    });

    test("should reject providers where default model is not in models array", () => {
      setupRepository();

      const configInvalidDefaultModel = {
        openai: {
          name: "OpenAI",
          models: ["gpt-4o-mini", "gpt-4o"],
          defaultModel: "gpt-3.5-turbo", // Not in models array
        },
        anthropic: {
          name: "Anthropic",
          models: ["claude"],
          defaultModel: "claude",
        },
        google: { name: "Google", models: ["gemini"], defaultModel: "gemini" },
        deepseek: {
          name: "DeepSeek",
          models: ["deepseek"],
          defaultModel: "deepseek",
        },
        openrouter: {
          name: "OpenRouter",
          models: ["openrouter"],
          defaultModel: "openrouter",
        },
      };
      assert.throws(() => {
        modelRepository.validateModelsConfig(configInvalidDefaultModel);
      }, /Default model gpt-3.5-turbo not in models list for openai/);
    });

    test("should validate the actual loaded configuration", () => {
      setupRepository();

      const actualConfig = modelRepository.loadModelsConfig();
      const isValid = modelRepository.validateModelsConfig(actualConfig);

      assert.strictEqual(isValid, true, "Loaded configuration should be valid");
    });
  });

  describe("Error Handling", () => {
    test("should handle file read errors gracefully", () => {
      // This test would require mocking fs to simulate file read errors
      // For now, we just ensure the repository doesn't throw on construction
      assert.doesNotThrow(() => {
        new FileModelRepository();
      });
    });
  });

  describe("Integration with DI Container", () => {
    test("should be resolvable from DI container", async () => {
      await import("../../lib/services.ts"); // Initialize DI container
      const repository =
        container.resolve<FileModelRepository>("ModelRepository");

      assert.ok(repository);
      assert.ok(typeof repository.loadModelsConfig === "function");
      assert.ok(typeof repository.validateModelsConfig === "function");
    });
  });
});
