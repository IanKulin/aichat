import { test, describe } from "node:test";
import assert from "node:assert";
import request from "supertest";
import express from "express";

// Mock the AI client functions that make external calls
const mockValidateAllProviders = () => {
  return {
    openai: true,
    google: false,
    anthropic: true,
    deepseek: false,
  };
};

describe("Server API Tests", () => {
  let app: express.Application;

  // Setup a test server with minimal configuration
  const setupTestServer = () => {
    const testApp = express();
    testApp.use(express.json());

    // Health endpoint
    testApp.get("/api/health", (req, res) => {
      const validation = mockValidateAllProviders();
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        apiKeys: validation,
      });
    });

    // Chat endpoint with validation (without AI calls)
    testApp.post("/api/chat", (req, res) => {
      const { messages, provider } = req.body;

      // Validate messages array
      if (!Array.isArray(messages) || messages.length === 0) {
        return res
          .status(400)
          .json({ error: "Messages must be a non-empty array" });
      }

      // Validate last message has content
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage.content || typeof lastMessage.content !== "string") {
        return res
          .status(400)
          .json({ error: "Last message must have content" });
      }

      // Validate provider
      const validProviders = ["openai", "google", "anthropic", "deepseek"];
      if (provider && !validProviders.includes(provider)) {
        return res.status(400).json({ error: "Invalid provider" });
      }

      // If validation passes, return success (without AI call)
      res.json({
        message: "Validation successful",
        provider: provider || "openai",
        messageCount: messages.length,
      });
    });

    // Static file serving
    testApp.get("/", (req, res) => {
      res.type("html").send("<html><body>AI Chat Interface</body></html>");
    });

    return testApp;
  };

  describe("GET /api/health", () => {
    test("should return health status with API key validation", async () => {
      app = setupTestServer();
      const response = await request(app).get("/api/health").expect(200);

      assert.strictEqual(response.body.status, "ok");
      assert.ok(response.body.timestamp);
      assert.ok(response.body.apiKeys);
      assert.strictEqual(typeof response.body.apiKeys.openai, "boolean");
      assert.strictEqual(typeof response.body.apiKeys.google, "boolean");
      assert.strictEqual(typeof response.body.apiKeys.anthropic, "boolean");
      assert.strictEqual(typeof response.body.apiKeys.deepseek, "boolean");
    });

    test("should return JSON content type", async () => {
      app = setupTestServer();
      const response = await request(app).get("/api/health").expect(200);

      assert.ok(response.headers["content-type"].includes("application/json"));
    });
  });

  describe("POST /api/chat", () => {
    test("should accept valid chat request", async () => {
      app = setupTestServer();
      const validRequest = {
        messages: [{ role: "user", content: "Hello, how are you?" }],
        provider: "openai",
      };

      const response = await request(app)
        .post("/api/chat")
        .send(validRequest)
        .expect(200);

      assert.strictEqual(response.body.message, "Validation successful");
      assert.strictEqual(response.body.provider, "openai");
      assert.strictEqual(response.body.messageCount, 1);
    });

    test("should use default provider when none specified", async () => {
      app = setupTestServer();
      const validRequest = {
        messages: [{ role: "user", content: "Hello, how are you?" }],
      };

      const response = await request(app)
        .post("/api/chat")
        .send(validRequest)
        .expect(200);

      assert.strictEqual(response.body.provider, "openai");
    });

    test("should reject empty messages array", async () => {
      app = setupTestServer();
      const invalidRequest = {
        messages: [],
        provider: "openai",
      };

      const response = await request(app)
        .post("/api/chat")
        .send(invalidRequest)
        .expect(400);

      assert.strictEqual(
        response.body.error,
        "Messages must be a non-empty array"
      );
    });

    test("should reject missing messages array", async () => {
      app = setupTestServer();
      const invalidRequest = {
        provider: "openai",
      };

      const response = await request(app)
        .post("/api/chat")
        .send(invalidRequest)
        .expect(400);

      assert.strictEqual(
        response.body.error,
        "Messages must be a non-empty array"
      );
    });

    test("should reject message without content", async () => {
      app = setupTestServer();
      const invalidRequest = {
        messages: [{ role: "user" }],
        provider: "openai",
      };

      const response = await request(app)
        .post("/api/chat")
        .send(invalidRequest)
        .expect(400);

      assert.strictEqual(response.body.error, "Last message must have content");
    });

    test("should reject message with empty content", async () => {
      app = setupTestServer();
      const invalidRequest = {
        messages: [{ role: "user", content: "" }],
        provider: "openai",
      };

      const response = await request(app)
        .post("/api/chat")
        .send(invalidRequest)
        .expect(400);

      assert.strictEqual(response.body.error, "Last message must have content");
    });

    test("should reject invalid provider", async () => {
      app = setupTestServer();
      const invalidRequest = {
        messages: [{ role: "user", content: "Hello" }],
        provider: "invalid-provider",
      };

      const response = await request(app)
        .post("/api/chat")
        .send(invalidRequest)
        .expect(400);

      assert.strictEqual(response.body.error, "Invalid provider");
    });

    test("should handle multiple messages", async () => {
      app = setupTestServer();
      const validRequest = {
        messages: [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi there!" },
          { role: "user", content: "How are you?" },
        ],
        provider: "anthropic",
      };

      const response = await request(app)
        .post("/api/chat")
        .send(validRequest)
        .expect(200);

      assert.strictEqual(response.body.messageCount, 3);
      assert.strictEqual(response.body.provider, "anthropic");
    });
  });

  describe("GET /", () => {
    test("should serve static HTML content", async () => {
      app = setupTestServer();
      const response = await request(app).get("/").expect(200);

      assert.ok(response.text.includes("<html>"));
      assert.ok(response.text.includes("AI Chat"));
    });

    test("should return HTML content type", async () => {
      app = setupTestServer();
      const response = await request(app).get("/").expect(200);

      assert.ok(response.headers["content-type"].includes("text/html"));
    });
  });
});
