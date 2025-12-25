import { test, describe } from "node:test";
import assert from "node:assert";
import { DefaultProviderController } from "../../controllers/ProviderController.ts";
import { container } from "../../lib/container.ts";
import type { ProviderService } from "../../services/ProviderService.ts";

describe("ProviderController Tests", () => {
  let providerController: DefaultProviderController;
  let mockProviderService: ProviderService;

  const setupController = () => {
    // Create mock service
    mockProviderService = {
      getProviderInfo: () => [
        {
          id: "openai",
          name: "OpenAI",
          models: ["gpt-4o", "gpt-4o-mini"],
          defaultModel: "gpt-4o-mini",
        },
        {
          id: "anthropic",
          name: "Anthropic",
          models: ["claude-3-5-haiku-20241022", "claude-3-5-sonnet-20241022"],
          defaultModel: "claude-3-5-haiku-20241022",
        },
      ],
      validateProvider: (provider: string) =>
        provider === "openai" || provider === "anthropic",
      getAvailableProviders: () => ["openai", "anthropic"],
      validateApiKey: (provider) => ({
        valid: true,
        message: `${provider} configured`,
      }),
      validateAllProviders: () => ({
        openai: { valid: true, message: "OpenAI configured" },
        anthropic: { valid: false, message: "Anthropic not configured" },
      }),
      getProviderModel: () => ({ model: "mock-model" }),
    } as ProviderService;

    // Create controller with mocked dependencies
    providerController = new DefaultProviderController(mockProviderService);
  };

  describe("getProviders() method", () => {
    test("should return provider information successfully", async () => {
      setupController();

      const mockRequest = {} as any;

      const mockResponse = {
        json: (data: any) => {
          assert.ok(data);
          assert.ok(Array.isArray(data.providers));
          assert.strictEqual(data.providers.length, 2);

          const openaiProvider = data.providers.find((p) => p.id === "openai");
          assert.ok(openaiProvider);
          assert.strictEqual(openaiProvider.name, "OpenAI");
          assert.ok(Array.isArray(openaiProvider.models));
          assert.ok(openaiProvider.models.includes("gpt-4o-mini"));

          const anthropicProvider = data.providers.find(
            (p) => p.id === "anthropic"
          );
          assert.ok(anthropicProvider);
          assert.strictEqual(anthropicProvider.name, "Anthropic");
          assert.ok(Array.isArray(anthropicProvider.models));

          assert.strictEqual(data.default, "openai");

          return mockResponse;
        },
        status: () => mockResponse,
      } as any;

      await providerController.getProviders(mockRequest, mockResponse);
    });

    test("should handle service errors by throwing", async () => {
      setupController();

      // Override mock to throw error
      mockProviderService.getProviderInfo = () => {
        throw new Error("Service error");
      };

      const mockRequest = {} as any;
      const mockResponse = {} as any;

      // The controller doesn't have built-in error handling, so it should throw
      assert.throws(() => {
        providerController.getProviders(mockRequest, mockResponse);
      }, /Service error/);
    });

    test("should handle empty provider list", async () => {
      setupController();

      // Override mock to return empty array
      mockProviderService.getProviderInfo = () => [];
      mockProviderService.getAvailableProviders = () => [];

      const mockRequest = {} as any;

      const mockResponse = {
        json: (data: any) => {
          assert.ok(data.providers);
          assert.ok(Array.isArray(data.providers));
          assert.strictEqual(data.providers.length, 0);
          assert.strictEqual(data.default, null);
          return mockResponse;
        },
        status: () => mockResponse,
      } as any;

      await providerController.getProviders(mockRequest, mockResponse);
    });
  });

  describe("Integration with DI Container", () => {
    test("should be resolvable from DI container", async () => {
      await import("../../lib/services.ts"); // Initialize DI container
      const controller =
        container.resolve<DefaultProviderController>("ProviderController");

      assert.ok(controller);
      assert.ok(typeof controller.getProviders === "function");
    });
  });
});
