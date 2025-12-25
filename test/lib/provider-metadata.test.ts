// test/lib/provider-metadata.test.ts - Tests for provider metadata module

import { describe, it } from "node:test";
import assert from "node:assert";
import {
  PROVIDER_METADATA,
  SUPPORTED_PROVIDERS,
  getProviderDisplayName,
  getProviderEnvVar,
  isValidProvider,
  type SupportedProvider,
} from "../../lib/provider-metadata.ts";

describe("Provider Metadata", () => {
  describe("PROVIDER_METADATA constant", () => {
    it("should contain all expected providers", () => {
      const expectedProviders = [
        "openai",
        "anthropic",
        "google",
        "deepseek",
        "openrouter",
      ];

      for (const provider of expectedProviders) {
        assert.ok(
          provider in PROVIDER_METADATA,
          `Provider ${provider} should exist in metadata`
        );
      }
    });

    it("should have name and envVar for each provider", () => {
      for (const [providerId, metadata] of Object.entries(PROVIDER_METADATA)) {
        assert.ok(metadata.name, `Provider ${providerId} should have a name`);
        assert.ok(
          metadata.envVar,
          `Provider ${providerId} should have an envVar`
        );
        assert.strictEqual(
          typeof metadata.name,
          "string",
          `Provider ${providerId} name should be a string`
        );
        assert.strictEqual(
          typeof metadata.envVar,
          "string",
          `Provider ${providerId} envVar should be a string`
        );
      }
    });

    it("should have correct environment variable names", () => {
      assert.strictEqual(PROVIDER_METADATA.openai.envVar, "OPENAI_API_KEY");
      assert.strictEqual(
        PROVIDER_METADATA.anthropic.envVar,
        "ANTHROPIC_API_KEY"
      );
      assert.strictEqual(
        PROVIDER_METADATA.google.envVar,
        "GOOGLE_GENERATIVE_AI_API_KEY"
      );
      assert.strictEqual(PROVIDER_METADATA.deepseek.envVar, "DEEPSEEK_API_KEY");
      assert.strictEqual(
        PROVIDER_METADATA.openrouter.envVar,
        "OPENROUTER_API_KEY"
      );
    });

    it("should have correct display names", () => {
      assert.strictEqual(PROVIDER_METADATA.openai.name, "OpenAI");
      assert.strictEqual(PROVIDER_METADATA.anthropic.name, "Anthropic");
      assert.strictEqual(PROVIDER_METADATA.google.name, "Google");
      assert.strictEqual(PROVIDER_METADATA.deepseek.name, "DeepSeek");
      assert.strictEqual(PROVIDER_METADATA.openrouter.name, "OpenRouter");
    });
  });

  describe("SUPPORTED_PROVIDERS constant", () => {
    it("should be an array", () => {
      assert.ok(Array.isArray(SUPPORTED_PROVIDERS));
    });

    it("should contain exactly 5 providers", () => {
      assert.strictEqual(SUPPORTED_PROVIDERS.length, 5);
    });

    it("should match keys of PROVIDER_METADATA", () => {
      const metadataKeys = Object.keys(PROVIDER_METADATA).sort();
      const supportedProviders = [...SUPPORTED_PROVIDERS].sort();

      assert.deepStrictEqual(supportedProviders, metadataKeys);
    });

    it("should include all expected providers", () => {
      const expectedProviders: SupportedProvider[] = [
        "openai",
        "anthropic",
        "google",
        "deepseek",
        "openrouter",
      ];

      for (const provider of expectedProviders) {
        assert.ok(
          SUPPORTED_PROVIDERS.includes(provider),
          `SUPPORTED_PROVIDERS should include ${provider}`
        );
      }
    });
  });

  describe("getProviderDisplayName()", () => {
    it("should return correct display name for each provider", () => {
      assert.strictEqual(getProviderDisplayName("openai"), "OpenAI");
      assert.strictEqual(getProviderDisplayName("anthropic"), "Anthropic");
      assert.strictEqual(getProviderDisplayName("google"), "Google");
      assert.strictEqual(getProviderDisplayName("deepseek"), "DeepSeek");
      assert.strictEqual(getProviderDisplayName("openrouter"), "OpenRouter");
    });

    it("should return a non-empty string", () => {
      for (const provider of SUPPORTED_PROVIDERS) {
        const displayName = getProviderDisplayName(provider);
        assert.ok(displayName.length > 0);
      }
    });
  });

  describe("getProviderEnvVar()", () => {
    it("should return correct environment variable name for each provider", () => {
      assert.strictEqual(getProviderEnvVar("openai"), "OPENAI_API_KEY");
      assert.strictEqual(getProviderEnvVar("anthropic"), "ANTHROPIC_API_KEY");
      assert.strictEqual(
        getProviderEnvVar("google"),
        "GOOGLE_GENERATIVE_AI_API_KEY"
      );
      assert.strictEqual(getProviderEnvVar("deepseek"), "DEEPSEEK_API_KEY");
      assert.strictEqual(getProviderEnvVar("openrouter"), "OPENROUTER_API_KEY");
    });

    it("should return a non-empty string", () => {
      for (const provider of SUPPORTED_PROVIDERS) {
        const envVar = getProviderEnvVar(provider);
        assert.ok(envVar.length > 0);
      }
    });

    it("should return uppercase env var names", () => {
      for (const provider of SUPPORTED_PROVIDERS) {
        const envVar = getProviderEnvVar(provider);
        assert.strictEqual(
          envVar,
          envVar.toUpperCase(),
          `${provider} env var should be uppercase`
        );
      }
    });
  });

  describe("isValidProvider()", () => {
    it("should return true for valid providers", () => {
      for (const provider of SUPPORTED_PROVIDERS) {
        assert.strictEqual(
          isValidProvider(provider),
          true,
          `${provider} should be valid`
        );
      }
    });

    it("should return false for invalid providers", () => {
      const invalidProviders = [
        "invalid",
        "unknown",
        "notaprovider",
        "",
        "OPENAI",
        "open ai",
      ];

      for (const provider of invalidProviders) {
        assert.strictEqual(
          isValidProvider(provider),
          false,
          `${provider} should be invalid`
        );
      }
    });

    it("should be case-sensitive", () => {
      assert.strictEqual(isValidProvider("openai"), true);
      assert.strictEqual(isValidProvider("OpenAI"), false);
      assert.strictEqual(isValidProvider("OPENAI"), false);
    });

    it("should work as a type guard", () => {
      const testProvider: string = "openai";

      if (isValidProvider(testProvider)) {
        // TypeScript should narrow the type to SupportedProvider here
        const displayName: string = getProviderDisplayName(testProvider);
        assert.ok(displayName);
      }
    });
  });

  describe("Type consistency", () => {
    it("should have consistent types between constant and type", () => {
      // This test verifies compile-time type consistency
      // If this compiles, the types are consistent
      const provider: SupportedProvider = "openai";
      const metadata = PROVIDER_METADATA[provider];

      assert.ok(metadata);
      assert.ok(metadata.name);
      assert.ok(metadata.envVar);
    });
  });
});
