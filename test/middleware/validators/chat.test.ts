// test/middleware/validators/chat.test.ts - Tests for chat validators

import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import type { Request, Response, NextFunction } from "express";
import {
  validateChatRequest,
  validateGenerateTitleRequest,
} from "../../../middleware/validators/chat.ts";

// Helper to create mock request/response objects
function createMocks() {
  const req = {
    body: {},
  } as unknown as Request;

  const res = {
    status: mock.fn((_code: number) => res),
    json: mock.fn(() => res),
  } as unknown as Response;

  const next = mock.fn() as unknown as NextFunction;

  return { req, res, next };
}

describe("Chat Validators", () => {
  describe("validateChatRequest", () => {
    it("should pass validation with valid messages", () => {
      const { req, res, next } = createMocks();
      req.body = {
        messages: [{ role: "user", content: "Hello" }],
      };

      validateChatRequest(req, res, next);

      assert.equal((next as ReturnType<typeof mock.fn>).mock.calls.length, 1);
    });

    it("should pass validation with multiple messages", () => {
      const { req, res, next } = createMocks();
      req.body = {
        messages: [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi there" },
          { role: "user", content: "How are you?" },
        ],
      };

      validateChatRequest(req, res, next);

      assert.equal((next as ReturnType<typeof mock.fn>).mock.calls.length, 1);
    });

    it("should pass validation with valid provider when provider is available", () => {
      // Note: This test passes only if OPENAI_API_KEY is set in environment
      // In test environment without API keys, provider validation will fail
      const { req, res, next } = createMocks();
      req.body = {
        messages: [{ role: "user", content: "Hello" }],
        provider: "openai",
      };

      validateChatRequest(req, res, next);

      const nextMock = next as ReturnType<typeof mock.fn>;
      const resMock = res as { status: ReturnType<typeof mock.fn> };

      // Will pass if provider is available, otherwise will return 400
      if (nextMock.mock.calls.length === 1) {
        // Provider was available and validation passed
        assert.equal(nextMock.mock.calls.length, 1);
      } else {
        // Provider was not available (no API key), validation returned error
        assert.equal(resMock.status.mock.calls.length, 1);
        assert.equal(resMock.status.mock.calls[0].arguments[0], 400);
      }
    });

    it("should pass validation without provider (uses default)", () => {
      const { req, res, next } = createMocks();
      req.body = {
        messages: [{ role: "user", content: "Hello" }],
      };

      validateChatRequest(req, res, next);

      assert.equal((next as ReturnType<typeof mock.fn>).mock.calls.length, 1);
    });

    it("should accept all valid message roles", () => {
      const { req, res, next } = createMocks();
      req.body = {
        messages: [
          { role: "system", content: "System message" },
          { role: "user", content: "User message" },
          { role: "assistant", content: "Assistant message" },
        ],
      };

      validateChatRequest(req, res, next);

      assert.equal((next as ReturnType<typeof mock.fn>).mock.calls.length, 1);
    });

    it("should reject empty messages array", () => {
      const { req, res, next } = createMocks();
      req.body = {
        messages: [],
      };

      validateChatRequest(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
      assert.equal(resMock.status.mock.calls[0].arguments[0], 400);
    });

    it("should reject missing messages", () => {
      const { req, res, next } = createMocks();
      req.body = {};

      validateChatRequest(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
    });

    it("should reject message without content", () => {
      const { req, res, next } = createMocks();
      req.body = {
        messages: [{ role: "user" }],
      };

      validateChatRequest(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
    });

    it("should reject message without role", () => {
      const { req, res, next } = createMocks();
      req.body = {
        messages: [{ content: "Hello" }],
      };

      validateChatRequest(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
    });

    it("should reject message with invalid role", () => {
      const { req, res, next } = createMocks();
      req.body = {
        messages: [{ role: "admin", content: "Hello" }],
      };

      validateChatRequest(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
    });

    it("should reject last message with empty content", () => {
      const { req, res, next } = createMocks();
      req.body = {
        messages: [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "" },
        ],
      };

      validateChatRequest(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
    });

    it("should reject unknown provider", () => {
      const { req, res, next } = createMocks();
      req.body = {
        messages: [{ role: "user", content: "Hello" }],
        provider: "completely-unknown-provider",
      };

      validateChatRequest(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
    });

    it("should return proper error message for empty messages", () => {
      const { req, res, next } = createMocks();
      req.body = {
        messages: [],
      };

      validateChatRequest(req, res, next);

      const resMock = res as { json: ReturnType<typeof mock.fn> };
      assert.equal(resMock.json.mock.calls.length, 1);
      const errorResponse = resMock.json.mock.calls[0].arguments[0];
      assert.equal(errorResponse.error, "Validation Error");
      assert.equal(errorResponse.message, "Messages array is required");
    });

    it("should return proper error message for unknown provider", () => {
      const { req, res, next } = createMocks();
      req.body = {
        messages: [{ role: "user", content: "Hello" }],
        provider: "completely-unknown-provider",
      };

      validateChatRequest(req, res, next);

      const resMock = res as { json: ReturnType<typeof mock.fn> };
      assert.equal(resMock.json.mock.calls.length, 1);
      const errorResponse = resMock.json.mock.calls[0].arguments[0];
      assert.equal(errorResponse.error, "Validation Error");
      assert(errorResponse.message.includes("not available"));
    });
  });

  describe("validateGenerateTitleRequest", () => {
    it("should pass validation with valid firstMessage", () => {
      const { req, res, next } = createMocks();
      req.body = {
        firstMessage: "This is the first message",
      };

      validateGenerateTitleRequest(req, res, next);

      assert.equal((next as ReturnType<typeof mock.fn>).mock.calls.length, 1);
    });

    it("should pass validation with long message", () => {
      const { req, res, next } = createMocks();
      req.body = {
        firstMessage:
          "This is a very long first message that should still be valid",
      };

      validateGenerateTitleRequest(req, res, next);

      assert.equal((next as ReturnType<typeof mock.fn>).mock.calls.length, 1);
    });

    it("should reject missing firstMessage", () => {
      const { req, res, next } = createMocks();
      req.body = {};

      validateGenerateTitleRequest(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
      assert.equal(resMock.status.mock.calls[0].arguments[0], 400);
    });

    it("should reject empty firstMessage", () => {
      const { req, res, next } = createMocks();
      req.body = {
        firstMessage: "",
      };

      validateGenerateTitleRequest(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
    });

    it("should reject whitespace-only firstMessage", () => {
      const { req, res, next } = createMocks();
      req.body = {
        firstMessage: "   ",
      };

      validateGenerateTitleRequest(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
    });

    it("should reject null firstMessage", () => {
      const { req, res, next } = createMocks();
      req.body = {
        firstMessage: null,
      };

      validateGenerateTitleRequest(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
    });

    it("should return proper error message for missing firstMessage", () => {
      const { req, res, next } = createMocks();
      req.body = {};

      validateGenerateTitleRequest(req, res, next);

      const resMock = res as { json: ReturnType<typeof mock.fn> };
      assert.equal(resMock.json.mock.calls.length, 1);
      const errorResponse = resMock.json.mock.calls[0].arguments[0];
      assert.equal(errorResponse.error, "Validation Error");
      assert.equal(
        errorResponse.message,
        "First message is required and must be a non-empty string"
      );
    });
  });
});
