// test/middleware/validators/common.test.ts - Tests for common validation helpers

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateRequiredString,
  validatePositiveNumber,
  validateNonNegativeNumber,
  validateNumberRange,
  validateRole,
  validateId,
  validateMessages,
} from "../../../middleware/validators/common.ts";
import { ValidationError } from "../../../types/middleware.ts";

describe("Common Validation Helpers", () => {
  describe("validateRequiredString", () => {
    it("should accept valid non-empty string", () => {
      const result = validateRequiredString("test", "Field");
      assert.equal(result, "test");
    });

    it("should trim whitespace from string", () => {
      const result = validateRequiredString("  test  ", "Field");
      assert.equal(result, "test");
    });

    it("should reject empty string", () => {
      assert.throws(
        () => validateRequiredString("", "Field"),
        (error: Error) => {
          assert(error instanceof ValidationError);
          assert.equal(
            error.message,
            "Field is required and must be a non-empty string"
          );
          return true;
        }
      );
    });

    it("should reject whitespace-only string", () => {
      assert.throws(
        () => validateRequiredString("   ", "Field"),
        (error: Error) => {
          assert(error instanceof ValidationError);
          assert.equal(
            error.message,
            "Field is required and must be a non-empty string"
          );
          return true;
        }
      );
    });

    it("should reject null", () => {
      assert.throws(
        () => validateRequiredString(null, "Field"),
        ValidationError
      );
    });

    it("should reject undefined", () => {
      assert.throws(
        () => validateRequiredString(undefined, "Field"),
        ValidationError
      );
    });

    it("should reject number", () => {
      assert.throws(
        () => validateRequiredString(123, "Field"),
        ValidationError
      );
    });
  });

  describe("validatePositiveNumber", () => {
    it("should accept positive number", () => {
      const result = validatePositiveNumber(5, "Field");
      assert.equal(result, 5);
    });

    it("should accept decimal number", () => {
      const result = validatePositiveNumber(3.14, "Field");
      assert.equal(result, 3.14);
    });

    it("should reject zero", () => {
      assert.throws(
        () => validatePositiveNumber(0, "Field"),
        (error: Error) => {
          assert(error instanceof ValidationError);
          assert.equal(error.message, "Field must be a positive number");
          return true;
        }
      );
    });

    it("should reject negative number", () => {
      assert.throws(() => validatePositiveNumber(-5, "Field"), ValidationError);
    });

    it("should reject non-number", () => {
      assert.throws(
        () => validatePositiveNumber("5", "Field"),
        ValidationError
      );
    });
  });

  describe("validateNonNegativeNumber", () => {
    it("should accept positive number", () => {
      const result = validateNonNegativeNumber(5, "Field");
      assert.equal(result, 5);
    });

    it("should accept zero", () => {
      const result = validateNonNegativeNumber(0, "Field");
      assert.equal(result, 0);
    });

    it("should reject negative number", () => {
      assert.throws(
        () => validateNonNegativeNumber(-1, "Field"),
        (error: Error) => {
          assert(error instanceof ValidationError);
          assert.equal(error.message, "Field must be a non-negative number");
          return true;
        }
      );
    });
  });

  describe("validateNumberRange", () => {
    it("should accept number within range", () => {
      const result = validateNumberRange(50, "Field", 1, 100);
      assert.equal(result, 50);
    });

    it("should accept minimum value", () => {
      const result = validateNumberRange(1, "Field", 1, 100);
      assert.equal(result, 1);
    });

    it("should accept maximum value", () => {
      const result = validateNumberRange(100, "Field", 1, 100);
      assert.equal(result, 100);
    });

    it("should reject number below minimum", () => {
      assert.throws(
        () => validateNumberRange(0, "Field", 1, 100),
        (error: Error) => {
          assert(error instanceof ValidationError);
          assert.equal(
            error.message,
            "Field must be a number between 1 and 100"
          );
          return true;
        }
      );
    });

    it("should reject number above maximum", () => {
      assert.throws(
        () => validateNumberRange(101, "Field", 1, 100),
        ValidationError
      );
    });

    it("should reject NaN", () => {
      assert.throws(
        () => validateNumberRange(NaN, "Field", 1, 100),
        ValidationError
      );
    });
  });

  describe("validateRole", () => {
    it("should accept 'user' role", () => {
      const result = validateRole("user");
      assert.equal(result, "user");
    });

    it("should accept 'assistant' role", () => {
      const result = validateRole("assistant");
      assert.equal(result, "assistant");
    });

    it("should accept 'system' role", () => {
      const result = validateRole("system");
      assert.equal(result, "system");
    });

    it("should reject invalid role", () => {
      assert.throws(
        () => validateRole("admin"),
        (error: Error) => {
          assert(error instanceof ValidationError);
          assert.equal(
            error.message,
            "Valid role is required (user, assistant, or system)"
          );
          return true;
        }
      );
    });

    it("should reject empty string", () => {
      assert.throws(() => validateRole(""), ValidationError);
    });

    it("should reject null", () => {
      assert.throws(() => validateRole(null), ValidationError);
    });
  });

  describe("validateId", () => {
    it("should accept valid string ID", () => {
      const result = validateId("abc123", "Resource ID");
      assert.equal(result, "abc123");
    });

    it("should use default field name", () => {
      assert.throws(
        () => validateId(null),
        (error: Error) => {
          assert(error instanceof ValidationError);
          assert.equal(error.message, "ID is required");
          return true;
        }
      );
    });

    it("should use custom field name", () => {
      assert.throws(
        () => validateId(null, "User ID"),
        (error: Error) => {
          assert(error instanceof ValidationError);
          assert.equal(error.message, "User ID is required");
          return true;
        }
      );
    });

    it("should reject empty string", () => {
      assert.throws(() => validateId("", "ID"), ValidationError);
    });

    it("should reject number", () => {
      assert.throws(() => validateId(123, "ID"), ValidationError);
    });
  });

  describe("validateMessages", () => {
    it("should accept valid messages array", () => {
      const messages = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
      ];
      const result = validateMessages(messages);
      assert.deepEqual(result, messages);
    });

    it("should accept single message", () => {
      const messages = [{ role: "user", content: "Hello" }];
      const result = validateMessages(messages);
      assert.deepEqual(result, messages);
    });

    it("should accept all valid roles", () => {
      const messages = [
        { role: "system", content: "System message" },
        { role: "user", content: "User message" },
        { role: "assistant", content: "Assistant message" },
      ];
      const result = validateMessages(messages);
      assert.deepEqual(result, messages);
    });

    it("should reject empty array", () => {
      assert.throws(
        () => validateMessages([]),
        (error: Error) => {
          assert(error instanceof ValidationError);
          assert.equal(error.message, "Messages array is required");
          return true;
        }
      );
    });

    it("should reject null", () => {
      assert.throws(() => validateMessages(null), ValidationError);
    });

    it("should reject non-array", () => {
      assert.throws(() => validateMessages("not an array"), ValidationError);
    });

    it("should reject message without content", () => {
      const messages = [{ role: "user" }];
      assert.throws(
        () => validateMessages(messages),
        (error: Error) => {
          assert(error instanceof ValidationError);
          assert.equal(error.message, "Last message must have content");
          return true;
        }
      );
    });

    it("should reject message without role", () => {
      const messages = [{ content: "Hello" }];
      assert.throws(() => validateMessages(messages), ValidationError);
    });

    it("should reject message with invalid role", () => {
      const messages = [{ role: "admin", content: "Hello" }];
      assert.throws(
        () => validateMessages(messages),
        (error: Error) => {
          assert(error instanceof ValidationError);
          assert.equal(
            error.message,
            "Message role must be user, assistant, or system"
          );
          return true;
        }
      );
    });

    it("should reject if last message has no content", () => {
      const messages = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "" },
      ];
      assert.throws(
        () => validateMessages(messages),
        (error: Error) => {
          assert(error instanceof ValidationError);
          assert.equal(error.message, "Last message must have content");
          return true;
        }
      );
    });
  });
});
