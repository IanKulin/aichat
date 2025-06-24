import { describe, it } from "node:test";
import assert from "node:assert";
import request from "supertest";
import { app } from "../server-app.ts";

describe("Chat API", () => {
  it("should reject empty messages array", async () => {
    const response = await request(app)
      .post("/api/chat")
      .send({ messages: [] });
    assert.strictEqual(response.status, 400);
    assert.match(response.body.error, /Messages array is required/);
  });

  it("should reject messages without content", async () => {
    const response = await request(app)
      .post("/api/chat")
      .send({ messages: [{ role: "user" }] });
    assert.strictEqual(response.status, 400);
    assert.match(response.body.error, /Last message must have content/);
  });
});

describe("Health Check API", () => {
  it("should return health status", async () => {
    const response = await request(app)
      .get("/api/health");
    assert.strictEqual(response.status, 200);
    assert.ok(response.body.timestamp);
    assert.strictEqual(response.body.version, "1.0.0");
  });
});
