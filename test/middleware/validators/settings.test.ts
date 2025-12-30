// test/middleware/validators/settings.test.ts - Tests for settings validators

import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import type { Request, Response, NextFunction } from "express";
import {
  validateSetApiKey,
  validateDeleteApiKey,
} from "../../../middleware/validators/settings.ts";

// Helper to create mock request/response objects
function createMocks() {
  const req = {
    body: {},
    params: {},
  } as unknown as Request;

  const res = {
    status: mock.fn((_code: number) => res),
    json: mock.fn(() => res),
  } as unknown as Response;

  const next = mock.fn() as unknown as NextFunction;

  return { req, res, next };
}

describe("Settings Validators", () => {
  describe("validateSetApiKey", () => {
    it("should pass validation with valid provider and key", () => {
      const { req, res, next } = createMocks();
      req.body = {
        provider: "openai",
        key: "sk-test123",
      };

      validateSetApiKey(req, res, next);

      assert.equal((next as ReturnType<typeof mock.fn>).mock.calls.length, 1);
    });

    it("should accept all valid providers", () => {
      const providers = [
        "openai",
        "anthropic",
        "google",
        "deepseek",
        "openrouter",
      ];

      for (const provider of providers) {
        const { req, res, next } = createMocks();
        req.body = {
          provider,
          key: "test-key",
        };

        validateSetApiKey(req, res, next);

        assert.equal((next as ReturnType<typeof mock.fn>).mock.calls.length, 1);
      }
    });

    it("should reject invalid provider", () => {
      const { req, res, next } = createMocks();
      req.body = {
        provider: "invalid-provider",
        key: "test-key",
      };

      validateSetApiKey(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
      assert.equal(resMock.status.mock.calls[0].arguments[0], 400);
    });

    it("should reject missing provider", () => {
      const { req, res, next } = createMocks();
      req.body = {
        key: "test-key",
      };

      validateSetApiKey(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
    });

    it("should reject missing key", () => {
      const { req, res, next } = createMocks();
      req.body = {
        provider: "openai",
      };

      validateSetApiKey(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
    });

    it("should reject empty provider", () => {
      const { req, res, next } = createMocks();
      req.body = {
        provider: "",
        key: "test-key",
      };

      validateSetApiKey(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
    });

    it("should reject empty key", () => {
      const { req, res, next } = createMocks();
      req.body = {
        provider: "openai",
        key: "",
      };

      validateSetApiKey(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
    });

    it("should return proper error message for invalid provider", () => {
      const { req, res, next } = createMocks();
      req.body = {
        provider: "unknown",
        key: "test-key",
      };

      validateSetApiKey(req, res, next);

      const resMock = res as { json: ReturnType<typeof mock.fn> };
      assert.equal(resMock.json.mock.calls.length, 1);
      const errorResponse = resMock.json.mock.calls[0].arguments[0];
      assert.equal(errorResponse.error, "Validation Error");
      assert.equal(errorResponse.message, "Invalid provider");
    });
  });

  describe("validateDeleteApiKey", () => {
    it("should pass validation with valid provider", () => {
      const { req, res, next } = createMocks();
      req.params = {
        provider: "openai",
      };

      validateDeleteApiKey(req, res, next);

      assert.equal((next as ReturnType<typeof mock.fn>).mock.calls.length, 1);
    });

    it("should accept all valid providers", () => {
      const providers = [
        "openai",
        "anthropic",
        "google",
        "deepseek",
        "openrouter",
      ];

      for (const provider of providers) {
        const { req, res, next } = createMocks();
        req.params = { provider };

        validateDeleteApiKey(req, res, next);

        assert.equal((next as ReturnType<typeof mock.fn>).mock.calls.length, 1);
      }
    });

    it("should reject invalid provider", () => {
      const { req, res, next } = createMocks();
      req.params = {
        provider: "invalid-provider",
      };

      validateDeleteApiKey(req, res, next);

      const resMock = res as { status: ReturnType<typeof mock.fn> };
      assert.equal(resMock.status.mock.calls.length, 1);
      assert.equal(resMock.status.mock.calls[0].arguments[0], 400);
    });

    it("should return proper error message for invalid provider", () => {
      const { req, res, next } = createMocks();
      req.params = {
        provider: "unknown",
      };

      validateDeleteApiKey(req, res, next);

      const resMock = res as { json: ReturnType<typeof mock.fn> };
      assert.equal(resMock.json.mock.calls.length, 1);
      const errorResponse = resMock.json.mock.calls[0].arguments[0];
      assert.equal(errorResponse.error, "Validation Error");
      assert.equal(errorResponse.message, "Invalid provider");
    });
  });
});
