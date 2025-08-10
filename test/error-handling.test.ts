import { test, describe } from "node:test";
import assert from "node:assert";

describe("Error Handling Tests", () => {
  describe("Error message sanitization", () => {
    const sanitizeError = (error: Error): string => {
      let clientError =
        "Sorry, I'm having trouble processing your request right now.";

      if (error.message.includes("API key")) {
        clientError = "Service configuration error. Please try again later.";
      } else if (error.message.includes("Network error")) {
        clientError =
          "Network error. Please check your connection and try again.";
      } else if (error.message.includes("API error")) {
        clientError =
          "AI service is temporarily unavailable. Please try again.";
      } else if (error.message.includes("Model error")) {
        clientError =
          "Selected model is not available. Please try a different model.";
      }

      return clientError;
    };

    test("should sanitize API key errors", () => {
      const error = new Error("Invalid API key provided");
      const result = sanitizeError(error);
      assert.strictEqual(
        result,
        "Service configuration error. Please try again later."
      );
    });

    test("should sanitize network errors", () => {
      const error = new Error("Network error: Connection timeout");
      const result = sanitizeError(error);
      assert.strictEqual(
        result,
        "Network error. Please check your connection and try again."
      );
    });

    test("should sanitize API errors", () => {
      const error = new Error("API error: Service unavailable");
      const result = sanitizeError(error);
      assert.strictEqual(
        result,
        "AI service is temporarily unavailable. Please try again."
      );
    });

    test("should sanitize model errors", () => {
      const error = new Error("Model error: Invalid model specified");
      const result = sanitizeError(error);
      assert.strictEqual(
        result,
        "Selected model is not available. Please try a different model."
      );
    });

    test("should return default error for unknown errors", () => {
      const error = new Error("Some unknown internal error");
      const result = sanitizeError(error);
      assert.strictEqual(
        result,
        "Sorry, I'm having trouble processing your request right now."
      );
    });

    test("should handle errors with multiple matching keywords", () => {
      const error = new Error("API key and Network error occurred");
      const result = sanitizeError(error);
      // Should match the first condition (API key)
      assert.strictEqual(
        result,
        "Service configuration error. Please try again later."
      );
    });

    test("should handle empty error messages", () => {
      const error = new Error("");
      const result = sanitizeError(error);
      assert.strictEqual(
        result,
        "Sorry, I'm having trouble processing your request right now."
      );
    });

    test("should handle error messages with partial matches", () => {
      const error = new Error("This is about API keys and stuff");
      const result = sanitizeError(error);
      assert.strictEqual(
        result,
        "Service configuration error. Please try again later."
      );
    });

    test("should be case sensitive for error matching", () => {
      const error = new Error("api key error"); // lowercase
      const result = sanitizeError(error);
      assert.strictEqual(
        result,
        "Sorry, I'm having trouble processing your request right now."
      );
    });

    test("should not expose internal error details", () => {
      const error = new Error(
        "Internal server error with sensitive data: password123"
      );
      const result = sanitizeError(error);
      assert.strictEqual(
        result,
        "Sorry, I'm having trouble processing your request right now."
      );

      // Ensure no sensitive data is exposed
      assert.ok(!result.includes("password123"));
      assert.ok(!result.includes("Internal server error"));
    });
  });
});
