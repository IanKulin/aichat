// test/middleware/validators/conversation.test.ts - Tests for conversation validators

import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import type { Request, Response, NextFunction } from "express";
import {
  validateCreateConversation,
  validateGetConversation,
  validateListConversations,
  validateUpdateConversationTitle,
  validateDeleteConversation,
  validateSaveMessage,
  validateBranchConversation,
  validateCleanupConversations,
} from "../../../middleware/validators/conversation.ts";

// Helper to create mock request/response objects
function createMocks() {
  const req = {
    body: {},
    params: {},
    query: {},
  } as unknown as Request;

  const res = {
    status: mock.fn((_code: number) => res),
    json: mock.fn(() => res),
  } as unknown as Response;

  const next = mock.fn() as unknown as NextFunction;

  return { req, res, next };
}

describe("Conversation Validators", () => {
  describe("validateCreateConversation", () => {
    it("should pass validation with valid title", () => {
      const { req, res, next } = createMocks();
      req.body = { title: "Test Conversation" };

      validateCreateConversation(req, res, next);

      assert.equal((next as ReturnType<typeof mock.fn>).mock.calls.length, 1);
      assert.equal(req.body.title, "Test Conversation");
    });

    it("should trim whitespace from title", () => {
      const { req, res, next } = createMocks();
      req.body = { title: "  Test  " };

      validateCreateConversation(req, res, next);

      assert.equal((next as ReturnType<typeof mock.fn>).mock.calls.length, 1);
      assert.equal(req.body.title, "Test");
    });

    it("should reject empty title", () => {
      const { req, res, next } = createMocks();
      req.body = { title: "" };

      validateCreateConversation(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
      assert.equal(resMock.status.mock.calls[0].arguments[0], 400);
    });

    it("should reject missing title", () => {
      const { req, res, next } = createMocks();
      req.body = {};

      validateCreateConversation(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
      assert.equal(resMock.status.mock.calls[0].arguments[0], 400);
    });
  });

  describe("validateGetConversation", () => {
    it("should pass validation with valid ID", () => {
      const { req, res, next } = createMocks();
      req.params = { id: "conv-123" };

      validateGetConversation(req, res, next);

      assert.equal((next as ReturnType<typeof mock.fn>).mock.calls.length, 1);
    });

    it("should reject missing ID", () => {
      const { req, res, next } = createMocks();
      req.params = {};

      validateGetConversation(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
      assert.equal(resMock.status.mock.calls[0].arguments[0], 400);
    });
  });

  describe("validateListConversations", () => {
    it("should pass validation with valid limit and offset", () => {
      const { req, res, next } = createMocks();
      req.query = { limit: "10", offset: "0" };

      validateListConversations(req, res, next);

      assert.equal((next as ReturnType<typeof mock.fn>).mock.calls.length, 1);
      assert.equal(req.query.limit, "10");
      assert.equal(req.query.offset, "0");
    });

    it("should use defaults when not provided", () => {
      const { req, res, next } = createMocks();
      req.query = {};

      validateListConversations(req, res, next);

      assert.equal((next as ReturnType<typeof mock.fn>).mock.calls.length, 1);
      assert.equal(req.query.limit, "50");
      assert.equal(req.query.offset, "0");
    });

    it("should reject limit above 100", () => {
      const { req, res, next } = createMocks();
      req.query = { limit: "101" };

      validateListConversations(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
      assert.equal(resMock.status.mock.calls[0].arguments[0], 400);
    });

    it("should reject limit below 1", () => {
      const { req, res, next } = createMocks();
      req.query = { limit: "0" };

      validateListConversations(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
    });

    it("should reject negative offset", () => {
      const { req, res, next } = createMocks();
      req.query = { offset: "-1" };

      validateListConversations(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
    });
  });

  describe("validateUpdateConversationTitle", () => {
    it("should pass validation with valid ID and title", () => {
      const { req, res, next } = createMocks();
      req.params = { id: "conv-123" };
      req.body = { title: "Updated Title" };

      validateUpdateConversationTitle(req, res, next);

      assert.equal((next as ReturnType<typeof mock.fn>).mock.calls.length, 1);
      assert.equal(req.body.title, "Updated Title");
    });

    it("should trim title", () => {
      const { req, res, next } = createMocks();
      req.params = { id: "conv-123" };
      req.body = { title: "  Trimmed  " };

      validateUpdateConversationTitle(req, res, next);

      assert.equal(req.body.title, "Trimmed");
    });

    it("should reject missing ID", () => {
      const { req, res, next } = createMocks();
      req.body = { title: "Title" };

      validateUpdateConversationTitle(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
    });

    it("should reject missing title", () => {
      const { req, res, next } = createMocks();
      req.params = { id: "conv-123" };
      req.body = {};

      validateUpdateConversationTitle(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
    });
  });

  describe("validateDeleteConversation", () => {
    it("should pass validation with valid ID", () => {
      const { req, res, next } = createMocks();
      req.params = { id: "conv-123" };

      validateDeleteConversation(req, res, next);

      assert.equal((next as ReturnType<typeof mock.fn>).mock.calls.length, 1);
    });

    it("should reject missing ID", () => {
      const { req, res, next } = createMocks();
      req.params = {};

      validateDeleteConversation(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
    });
  });

  describe("validateSaveMessage", () => {
    it("should pass validation with valid message data", () => {
      const { req, res, next } = createMocks();
      req.body = {
        conversationId: "conv-123",
        role: "user",
        content: "Hello world",
      };

      validateSaveMessage(req, res, next);

      assert.equal((next as ReturnType<typeof mock.fn>).mock.calls.length, 1);
      assert.equal(req.body.content, "Hello world");
    });

    it("should accept all valid roles", () => {
      const roles = ["user", "assistant", "system"] as const;

      for (const role of roles) {
        const { req, res, next } = createMocks();
        req.body = {
          conversationId: "conv-123",
          role,
          content: "Test",
        };

        validateSaveMessage(req, res, next);

        assert.equal((next as ReturnType<typeof mock.fn>).mock.calls.length, 1);
      }
    });

    it("should trim content", () => {
      const { req, res, next } = createMocks();
      req.body = {
        conversationId: "conv-123",
        role: "user",
        content: "  trimmed  ",
      };

      validateSaveMessage(req, res, next);

      assert.equal(req.body.content, "trimmed");
    });

    it("should reject invalid role", () => {
      const { req, res, next } = createMocks();
      req.body = {
        conversationId: "conv-123",
        role: "admin",
        content: "Test",
      };

      validateSaveMessage(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
    });

    it("should reject missing conversationId", () => {
      const { req, res, next } = createMocks();
      req.body = {
        role: "user",
        content: "Test",
      };

      validateSaveMessage(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
    });

    it("should reject empty content", () => {
      const { req, res, next } = createMocks();
      req.body = {
        conversationId: "conv-123",
        role: "user",
        content: "",
      };

      validateSaveMessage(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
    });
  });

  describe("validateBranchConversation", () => {
    it("should pass validation with valid data", () => {
      const { req, res, next } = createMocks();
      req.params = { id: "conv-123" };
      req.body = {
        upToTimestamp: 1234567890,
        newTitle: "Branched Conversation",
      };

      validateBranchConversation(req, res, next);

      assert.equal((next as ReturnType<typeof mock.fn>).mock.calls.length, 1);
      assert.equal(req.body.newTitle, "Branched Conversation");
    });

    it("should trim newTitle", () => {
      const { req, res, next } = createMocks();
      req.params = { id: "conv-123" };
      req.body = {
        upToTimestamp: 1234567890,
        newTitle: "  Trimmed  ",
      };

      validateBranchConversation(req, res, next);

      assert.equal(req.body.newTitle, "Trimmed");
    });

    it("should reject zero timestamp", () => {
      const { req, res, next } = createMocks();
      req.params = { id: "conv-123" };
      req.body = {
        upToTimestamp: 0,
        newTitle: "Branch",
      };

      validateBranchConversation(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
    });

    it("should reject negative timestamp", () => {
      const { req, res, next } = createMocks();
      req.params = { id: "conv-123" };
      req.body = {
        upToTimestamp: -1,
        newTitle: "Branch",
      };

      validateBranchConversation(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
    });

    it("should reject missing newTitle", () => {
      const { req, res, next } = createMocks();
      req.params = { id: "conv-123" };
      req.body = {
        upToTimestamp: 1234567890,
      };

      validateBranchConversation(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
    });
  });

  describe("validateCleanupConversations", () => {
    it("should pass validation with valid days parameter", () => {
      const { req, res, next } = createMocks();
      req.query = { days: "30" };

      validateCleanupConversations(req, res, next);

      assert.equal((next as ReturnType<typeof mock.fn>).mock.calls.length, 1);
      assert.equal(req.query.days, "30");
    });

    it("should use default from env when not provided", () => {
      const { req, res, next } = createMocks();
      req.query = {};

      validateCleanupConversations(req, res, next);

      assert.equal((next as ReturnType<typeof mock.fn>).mock.calls.length, 1);
      // Should default to 90 days
      assert.equal(req.query.days, "90");
    });

    it("should reject zero days", () => {
      const { req, res, next } = createMocks();
      req.query = { days: "0" };

      validateCleanupConversations(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
    });

    it("should reject negative days", () => {
      const { req, res, next } = createMocks();
      req.query = { days: "-1" };

      validateCleanupConversations(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
    });
  });
});
