// test/controllers/SettingsController.test.ts - Tests for SettingsController

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { DefaultSettingsController } from "../../controllers/SettingsController.ts";
import { SettingsService } from "../../services/SettingsService.ts";
import type {
  SupportedProvider,
  ApiKeyStatus,
  ApiKeyValidation,
} from "../../lib/types.ts";
import type { Request, Response } from "express";

// Mock implementations
class MockSettingsService extends SettingsService {
  private keys: Map<SupportedProvider, string> = new Map();

  async getApiKeys(): Promise<Record<SupportedProvider, ApiKeyStatus>> {
    const result: Record<SupportedProvider, ApiKeyStatus> = {
      openai: { configured: false },
      anthropic: { configured: false },
      google: { configured: false },
      deepseek: { configured: false },
      openrouter: { configured: false },
    };

    for (const [provider, key] of this.keys.entries()) {
      result[provider] = {
        configured: true,
        maskedKey: this.maskKey(key),
      };
    }

    return result;
  }

  async setApiKey(
    provider: SupportedProvider,
    key: string
  ): Promise<ApiKeyValidation> {
    this.keys.set(provider, key);
    return {
      valid: true,
      message: `${provider} API key validated successfully`,
    };
  }

  async deleteApiKey(provider: SupportedProvider): Promise<void> {
    this.keys.delete(provider);
  }

  private maskKey(key: string): string {
    if (key.length < 16) return "***";
    return `${key.substring(0, 7)}***...***${key.substring(key.length - 4)}`;
  }

  // Helper for testing
  setMockKey(provider: SupportedProvider, key: string): void {
    this.keys.set(provider, key);
  }
}

class MockResponse {
  public statusCode = 200;
  public jsonData: any = null;

  status(code: number): this {
    this.statusCode = code;
    return this;
  }

  json(data: any): this {
    this.jsonData = data;
    return this;
  }
}

function createMockRequest(
  body: any = {},
  params: any = {},
  query: any = {}
): Request {
  return {
    body,
    params,
    query,
  } as Request;
}

describe("SettingsController Tests", () => {
  let controller: DefaultSettingsController;
  let mockService: MockSettingsService;

  beforeEach(() => {
    mockService = new MockSettingsService();
    controller = new DefaultSettingsController(mockService);
  });

  describe("getApiKeys", () => {
    it("should return all API keys", async () => {
      const req = createMockRequest();
      const res = new MockResponse();

      await controller.getApiKeys(req, res as unknown as Response);

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.jsonData);
      assert.strictEqual(res.jsonData.openai.configured, false);
      assert.strictEqual(res.jsonData.anthropic.configured, false);
    });

    it("should return configured keys with masked values", async () => {
      mockService.setMockKey("openai", "sk-test-123456789012");

      const req = createMockRequest();
      const res = new MockResponse();

      await controller.getApiKeys(req, res as unknown as Response);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.jsonData.openai.configured, true);
      assert.ok(res.jsonData.openai.maskedKey);
      assert.ok(res.jsonData.openai.maskedKey.includes("***"));
    });
  });

  describe("setApiKey", () => {
    it("should save API key and return validation result", async () => {
      const req = createMockRequest({
        provider: "openai",
        key: "sk-test-123456789012",
      });
      const res = new MockResponse();

      await controller.setApiKey(req, res as unknown as Response);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.jsonData.valid, true);
      assert.ok(res.jsonData.message.includes("validated successfully"));
    });

    // Note: Validation tests removed - validation is now handled by middleware
    // See test/middleware/validators/settings.test.ts for validation tests

    it("should accept all supported providers", async () => {
      const providers: SupportedProvider[] = [
        "openai",
        "anthropic",
        "google",
        "deepseek",
        "openrouter",
      ];

      for (const provider of providers) {
        const req = createMockRequest({
          provider,
          key: "test-key-123456789012",
        });
        const res = new MockResponse();

        await controller.setApiKey(req, res as unknown as Response);

        assert.strictEqual(
          res.statusCode,
          200,
          `Should accept provider: ${provider}`
        );
      }
    });
  });

  describe("deleteApiKey", () => {
    it("should delete API key and return success", async () => {
      mockService.setMockKey("openai", "sk-test-123456789012");

      const req = createMockRequest({}, { provider: "openai" });
      const res = new MockResponse();

      await controller.deleteApiKey(req, res as unknown as Response);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.jsonData.success, true);
    });

    // Note: Validation tests removed - validation is now handled by middleware
    // See test/middleware/validators/settings.test.ts for validation tests

    it("should accept all supported providers for deletion", async () => {
      const providers: SupportedProvider[] = [
        "openai",
        "anthropic",
        "google",
        "deepseek",
        "openrouter",
      ];

      for (const provider of providers) {
        const req = createMockRequest({}, { provider });
        const res = new MockResponse();

        await controller.deleteApiKey(req, res as unknown as Response);

        assert.strictEqual(
          res.statusCode,
          200,
          `Should accept provider: ${provider}`
        );
      }
    });

    it("should handle deleting non-existent key gracefully", async () => {
      const req = createMockRequest({}, { provider: "openai" });
      const res = new MockResponse();

      await controller.deleteApiKey(req, res as unknown as Response);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.jsonData.success, true);
    });
  });
});
