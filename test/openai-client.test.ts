import { describe, it, after } from "node:test";
import assert from "node:assert";
import { validateApiKey, sendMessage } from "../lib/openai-client.ts";

// Mock Response class for fetch
class MockResponse extends Response {
  ok: boolean;
  status: number;
  statusText: string;
  jsonData: unknown;

  constructor(
    ok: boolean,
    status: number,
    statusText: string,
    jsonData: unknown
  ) {
    super(null, { status, statusText });
    this.ok = ok;
    this.status = status;
    this.statusText = statusText;
    this.jsonData = jsonData;
  }
  async json() {
    return this.jsonData;
  }
  get headers() {
    return new Headers();
  }
  get redirected() {
    return false;
  }
  get type() {
    return "basic" as const;
  }
  get url() {
    return "";
  }
  clone() {
    return this;
  }
  get body() {
    return null;
  }
  get bodyUsed() {
    return false;
  }
  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(0));
  }
  blob() {
    return Promise.resolve(new Blob());
  }
  formData() {
    return Promise.resolve(new FormData());
  }
  text() {
    return Promise.resolve("");
  }
}

describe("API Key Validation", () => {
  it("should detect missing API key", () => {
    delete process.env.OPENAI_API_KEY;
    const result = validateApiKey();
    assert.strictEqual(result.valid, false);
    assert.match(result.message, /not found in environment variables/);
  });

  it("should detect invalid API key format", () => {
    process.env.OPENAI_API_KEY = "invalid-key";
    const result = validateApiKey();
    assert.strictEqual(result.valid, false);
    assert.match(result.message, /should start with "sk-"/);
  });

  it("should validate correct API key format", () => {
    process.env.OPENAI_API_KEY = "sk-test12345678901234567890";
    const result = validateApiKey();
    assert.strictEqual(result.valid, true);
  });
});

describe("OpenAI Client", () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.OPENAI_API_KEY;

  after(() => {
    global.fetch = originalFetch;
    if (originalApiKey) {
      process.env.OPENAI_API_KEY = originalApiKey;
    } else {
      delete process.env.OPENAI_API_KEY;
    }
  });

  it("should reject when API key is missing", async () => {
    delete process.env.OPENAI_API_KEY;
    await assert.rejects(
      () => sendMessage([{ role: "user", content: "test" }]),
      { message: /OPENAI_API_KEY environment variable is not set/ }
    );
  });

  it("should handle network errors", async () => {
    process.env.OPENAI_API_KEY = "sk-test12345678901234567890";
    global.fetch = () => Promise.reject(new Error("Network error"));
    await assert.rejects(
      () => sendMessage([{ role: "user", content: "test" }]),
      { message: /Network error/ }
    );
  });

  it("should handle API response errors", async () => {
    process.env.OPENAI_API_KEY = "sk-test12345678901234567890";
    global.fetch = () =>
      Promise.resolve(
        new MockResponse(false, 401, "Unauthorized", {
          error: { message: "Invalid API key" },
        })
      );
    await assert.rejects(
      () => sendMessage([{ role: "user", content: "test" }]),
      { message: /OpenAI API error: 401 Unauthorized/ }
    );
  });

  it("should parse successful responses", async () => {
    process.env.OPENAI_API_KEY = "sk-test12345678901234567890";
    global.fetch = () =>
      Promise.resolve(
        new MockResponse(true, 200, "OK", {
          choices: [{ message: { content: "Test response" } }],
        })
      );
    const result = await sendMessage([{ role: "user", content: "test" }]);
    assert.strictEqual(result, "Test response");
  });
});
