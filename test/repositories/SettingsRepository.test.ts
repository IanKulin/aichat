// test/repositories/SettingsRepository.test.ts - Tests for SettingsRepository

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import fs from "fs";
import path from "path";
import { SettingsRepository } from "../../repositories/SettingsRepository.ts";
import { closeDatabase, getDatabase } from "../../lib/database.ts";
import { SUPPORTED_PROVIDERS } from "../../lib/provider-metadata.ts";

describe("SettingsRepository Tests", () => {
  let repository: SettingsRepository;
  const testDbPath = path.join(process.cwd(), "data", "db", "test-chat.db");

  beforeEach(async () => {
    // Clean slate for each test
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    // Clean up the main db path too if it exists from previous tests
    const mainDbPath = path.join(process.cwd(), "data", "db", "chat.db");
    if (fs.existsSync(mainDbPath)) {
      fs.unlinkSync(mainDbPath);
    }
    repository = new SettingsRepository();
  });

  afterEach(async () => {
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    const mainDbPath = path.join(process.cwd(), "data", "db", "chat.db");
    if (fs.existsSync(mainDbPath)) {
      fs.unlinkSync(mainDbPath);
    }
  });

  describe("getApiKey", () => {
    it("should return null when key doesn't exist", () => {
      const result = repository.getApiKey("openai");
      assert.strictEqual(
        result,
        null,
        "Should return null for non-existent key"
      );
    });

    it("should return the API key when it exists", () => {
      repository.setApiKey("openai", "sk-test-123");
      const result = repository.getApiKey("openai");
      assert.strictEqual(
        result,
        "sk-test-123",
        "Should return the stored API key"
      );
    });

    it("should return null for different providers when only one is set", () => {
      repository.setApiKey("openai", "sk-test-123");

      assert.strictEqual(repository.getApiKey("openai"), "sk-test-123");
      assert.strictEqual(repository.getApiKey("anthropic"), null);
      assert.strictEqual(repository.getApiKey("google"), null);
      assert.strictEqual(repository.getApiKey("deepseek"), null);
      assert.strictEqual(repository.getApiKey("openrouter"), null);
    });
  });

  describe("setApiKey", () => {
    it("should store a new API key", () => {
      repository.setApiKey("openai", "sk-test-123");

      const result = repository.getApiKey("openai");
      assert.strictEqual(result, "sk-test-123", "Should store the API key");
    });

    it("should update an existing API key", () => {
      repository.setApiKey("openai", "sk-test-old");
      repository.setApiKey("openai", "sk-test-new");

      const result = repository.getApiKey("openai");
      assert.strictEqual(result, "sk-test-new", "Should update the API key");
    });

    it("should store API keys for different providers independently", () => {
      repository.setApiKey("openai", "sk-openai-123");
      repository.setApiKey("anthropic", "sk-ant-456");
      repository.setApiKey("google", "google-789");

      assert.strictEqual(repository.getApiKey("openai"), "sk-openai-123");
      assert.strictEqual(repository.getApiKey("anthropic"), "sk-ant-456");
      assert.strictEqual(repository.getApiKey("google"), "google-789");
    });

    it("should update timestamp when setting key", async () => {
      const db = getDatabase();

      repository.setApiKey("openai", "sk-test-123");
      const firstResult = db
        .prepare("SELECT updated_at FROM settings WHERE key = ?")
        .get("api_key_openai") as { updated_at: number };

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      repository.setApiKey("openai", "sk-test-456");
      const secondResult = db
        .prepare("SELECT updated_at FROM settings WHERE key = ?")
        .get("api_key_openai") as { updated_at: number };

      assert.ok(
        secondResult.updated_at > firstResult.updated_at,
        "Timestamp should be updated when key is modified"
      );
    });
  });

  describe("getAllApiKeys", () => {
    it("should return all provider keys with null for unconfigured providers", () => {
      const result = repository.getAllApiKeys();

      assert.deepStrictEqual(
        result,
        {
          openai: null,
          anthropic: null,
          google: null,
          deepseek: null,
          openrouter: null,
        },
        "Should return all providers with null values"
      );
    });

    it("should return all provider keys with mixed configured and unconfigured", () => {
      repository.setApiKey("openai", "sk-openai-123");
      repository.setApiKey("anthropic", "sk-ant-456");

      const result = repository.getAllApiKeys();

      assert.deepStrictEqual(
        result,
        {
          openai: "sk-openai-123",
          anthropic: "sk-ant-456",
          google: null,
          deepseek: null,
          openrouter: null,
        },
        "Should return all providers with configured and null values"
      );
    });

    it("should return all provider keys when all are configured", () => {
      repository.setApiKey("openai", "sk-openai-123");
      repository.setApiKey("anthropic", "sk-ant-456");
      repository.setApiKey("google", "google-789");
      repository.setApiKey("deepseek", "deepseek-abc");
      repository.setApiKey("openrouter", "openrouter-xyz");

      const result = repository.getAllApiKeys();

      assert.deepStrictEqual(
        result,
        {
          openai: "sk-openai-123",
          anthropic: "sk-ant-456",
          google: "google-789",
          deepseek: "deepseek-abc",
          openrouter: "openrouter-xyz",
        },
        "Should return all configured provider keys"
      );
    });
  });

  describe("deleteApiKey", () => {
    it("should remove a stored API key", () => {
      repository.setApiKey("openai", "sk-test-123");
      assert.strictEqual(repository.getApiKey("openai"), "sk-test-123");

      repository.deleteApiKey("openai");

      const result = repository.getApiKey("openai");
      assert.strictEqual(result, null, "API key should be deleted");
    });

    it("should only delete the specified provider key", () => {
      repository.setApiKey("openai", "sk-openai-123");
      repository.setApiKey("anthropic", "sk-ant-456");
      repository.setApiKey("google", "google-789");

      repository.deleteApiKey("openai");

      assert.strictEqual(repository.getApiKey("openai"), null);
      assert.strictEqual(repository.getApiKey("anthropic"), "sk-ant-456");
      assert.strictEqual(repository.getApiKey("google"), "google-789");
    });

    it("should handle deleting a non-existent key gracefully", () => {
      // Should not throw an error
      repository.deleteApiKey("openai");

      const result = repository.getApiKey("openai");
      assert.strictEqual(
        result,
        null,
        "Should remain null after deleting non-existent key"
      );
    });

    it("should be able to re-add a deleted key", () => {
      repository.setApiKey("openai", "sk-test-old");
      repository.deleteApiKey("openai");
      repository.setApiKey("openai", "sk-test-new");

      const result = repository.getApiKey("openai");
      assert.strictEqual(
        result,
        "sk-test-new",
        "Should be able to re-add a deleted key"
      );
    });
  });

  describe("Database persistence", () => {
    it("should persist API keys across repository instances", () => {
      repository.setApiKey("openai", "sk-test-123");

      // Create a new repository instance
      const newRepository = new SettingsRepository();
      const result = newRepository.getApiKey("openai");

      assert.strictEqual(
        result,
        "sk-test-123",
        "API key should persist across instances"
      );
    });

    it("should handle multiple concurrent operations", async () => {
      // Set all keys concurrently
      SUPPORTED_PROVIDERS.forEach((provider, index) => {
        repository.setApiKey(provider, `key-${index}`);
      });

      const result = repository.getAllApiKeys();

      assert.strictEqual(result.openai, "key-0");
      assert.strictEqual(result.anthropic, "key-1");
      assert.strictEqual(result.google, "key-2");
      assert.strictEqual(result.deepseek, "key-3");
      assert.strictEqual(result.openrouter, "key-4");
    });
  });
});
