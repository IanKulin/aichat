// test/controllers/ConversationController.test.ts - Tests for ConversationController

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import request from "supertest";
import express from "express";
import { DefaultConversationController } from "../../controllers/ConversationController.ts";
import type { ConversationService } from "../../services/ConversationService.ts";
import { asyncHandler } from "../../middleware/errorHandler.ts";

// Mock ConversationService implementation
class MockConversationService implements ConversationService {
  private conversations = new Map();
  private messages = new Map();
  private nextId = 1;

  // Conversation management methods
  async createConversation(data: any) {
    const conversation = {
      id: `conv-${this.nextId++}`,
      title: data.title,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  async getConversation(id: string) {
    const conversation = this.conversations.get(id);
    if (!conversation) return null;

    const conversationMessages = Array.from(this.messages.values())
      .filter((msg: any) => msg.conversationId === id)
      .sort((a: any, b: any) => a.timestamp.getTime() - b.timestamp.getTime());

    return {
      ...conversation,
      messages: conversationMessages,
    };
  }

  async listConversations(limit = 50, offset = 0) {
    const conversations = Array.from(this.conversations.values())
      .sort((a: any, b: any) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(offset, offset + limit);
    return conversations;
  }

  async updateConversationTitle(id: string, title: string) {
    const conversation = this.conversations.get(id);
    if (!conversation) {
      throw new Error(`Conversation with id ${id} not found`);
    }
    conversation.title = title;
    conversation.updatedAt = new Date();
  }

  async deleteConversation(id: string) {
    if (!this.conversations.has(id)) {
      throw new Error(`Conversation with id ${id} not found`);
    }
    this.conversations.delete(id);

    // Delete associated messages
    for (const [msgId, message] of this.messages.entries()) {
      if ((message as any).conversationId === id) {
        this.messages.delete(msgId);
      }
    }
  }

  async saveMessageToConversation(data: any) {
    const message = {
      id: this.nextId++,
      conversationId: data.conversationId,
      role: data.role,
      content: data.content,
      timestamp: new Date(),
      provider: data.provider,
      model: data.model,
    };
    this.messages.set(message.id, message);

    // Update conversation timestamp
    const conversation = this.conversations.get(data.conversationId);
    if (conversation) {
      conversation.updatedAt = new Date();
    }
  }

  async cleanupOldConversations(_retentionDays: number) {
    return 0;
  }

  async branchConversation(
    _sourceConversationId: string,
    _upToTimestamp: number,
    _newTitle: string
  ) {
    const newConv = await this.createConversation({ title: _newTitle });
    return {
      ...newConv,
      messages: [],
    };
  }
}

describe("ConversationController Tests", () => {
  let app: express.Application;
  let mockConversationService: MockConversationService;
  let controller: DefaultConversationController;

  beforeEach(() => {
    mockConversationService = new MockConversationService();
    controller = new DefaultConversationController(mockConversationService);

    app = express();
    app.use(express.json());

    // Setup routes
    app.post(
      "/api/conversations",
      asyncHandler(async (req, res) => {
        await controller.createConversation(req, res);
      })
    );

    app.get(
      "/api/conversations",
      asyncHandler(async (req, res) => {
        await controller.listConversations(req, res);
      })
    );

    app.get(
      "/api/conversations/:id",
      asyncHandler(async (req, res) => {
        await controller.getConversation(req, res);
      })
    );

    app.put(
      "/api/conversations/:id/title",
      asyncHandler(async (req, res) => {
        await controller.updateConversationTitle(req, res);
      })
    );

    app.delete(
      "/api/conversations/:id",
      asyncHandler(async (req, res) => {
        await controller.deleteConversation(req, res);
      })
    );

    app.post(
      "/api/conversations/messages",
      asyncHandler(async (req, res) => {
        await controller.saveMessage(req, res);
      })
    );
  });

  describe("POST /api/conversations", () => {
    it("should create a new conversation", async () => {
      const response = await request(app)
        .post("/api/conversations")
        .send({ title: "Test Conversation" })
        .expect(201);

      assert.ok(response.body.id, "Should return conversation ID");
      assert.strictEqual(response.body.title, "Test Conversation");
      assert.ok(response.body.createdAt, "Should have createdAt");
      assert.ok(response.body.updatedAt, "Should have updatedAt");
    });

    it("should reject empty title", async () => {
      const response = await request(app)
        .post("/api/conversations")
        .send({ title: "" })
        .expect(400);

      assert.ok(response.body.error.includes("Title is required"));
    });

    it("should reject missing title", async () => {
      const response = await request(app)
        .post("/api/conversations")
        .send({})
        .expect(400);

      assert.ok(response.body.error.includes("Title is required"));
    });

    it("should reject non-string title", async () => {
      const response = await request(app)
        .post("/api/conversations")
        .send({ title: 123 })
        .expect(400);

      assert.ok(response.body.error.includes("Title is required"));
    });

    it("should trim whitespace from title", async () => {
      const response = await request(app)
        .post("/api/conversations")
        .send({ title: "  Test Conversation  " })
        .expect(201);

      assert.strictEqual(response.body.title, "Test Conversation");
    });
  });

  describe("GET /api/conversations", () => {
    it("should list conversations", async () => {
      // Create some test conversations
      await mockConversationService.createConversation({ title: "Conv 1" });
      await mockConversationService.createConversation({ title: "Conv 2" });

      const response = await request(app).get("/api/conversations").expect(200);

      assert.strictEqual(response.body.conversations.length, 2);
      assert.strictEqual(response.body.limit, 50);
      assert.strictEqual(response.body.offset, 0);
    });

    it("should handle limit parameter", async () => {
      // Create test conversations
      for (let i = 1; i <= 5; i++) {
        await mockConversationService.createConversation({
          title: `Conv ${i}`,
        });
      }

      const response = await request(app)
        .get("/api/conversations?limit=3")
        .expect(200);

      assert.strictEqual(response.body.conversations.length, 3);
      assert.strictEqual(response.body.limit, 3);
    });

    it("should handle offset parameter", async () => {
      // Create test conversations
      for (let i = 1; i <= 5; i++) {
        await mockConversationService.createConversation({
          title: `Conv ${i}`,
        });
      }

      const response = await request(app)
        .get("/api/conversations?offset=2")
        .expect(200);

      assert.strictEqual(response.body.conversations.length, 3);
      assert.strictEqual(response.body.offset, 2);
    });

    it("should reject invalid limit", async () => {
      const response = await request(app)
        .get("/api/conversations?limit=abc")
        .expect(400);

      assert.ok(response.body.error.includes("Limit must be a number"));
    });

    it("should reject limit over 100", async () => {
      const response = await request(app)
        .get("/api/conversations?limit=150")
        .expect(400);

      assert.ok(
        response.body.error.includes("Limit must be a number between 1 and 100")
      );
    });

    it("should reject negative offset", async () => {
      const response = await request(app)
        .get("/api/conversations?offset=-1")
        .expect(400);

      assert.ok(
        response.body.error.includes("Offset must be a non-negative number")
      );
    });
  });

  describe("GET /api/conversations/:id", () => {
    it("should get conversation by ID", async () => {
      const conversation = await mockConversationService.createConversation({
        title: "Test Conv",
      });

      const response = await request(app)
        .get(`/api/conversations/${conversation.id}`)
        .expect(200);

      assert.strictEqual(response.body.id, conversation.id);
      assert.strictEqual(response.body.title, "Test Conv");
      assert.deepStrictEqual(response.body.messages, []);
    });

    it("should return 404 for non-existent conversation", async () => {
      const response = await request(app)
        .get("/api/conversations/non-existent")
        .expect(404);

      assert.ok(response.body.error.includes("Conversation not found"));
    });
  });

  describe("PUT /api/conversations/:id/title", () => {
    it("should update conversation title", async () => {
      const conversation = await mockConversationService.createConversation({
        title: "Original Title",
      });

      const response = await request(app)
        .put(`/api/conversations/${conversation.id}/title`)
        .send({ title: "Updated Title" })
        .expect(200);

      assert.ok(response.body.success);
      assert.ok(response.body.message.includes("updated successfully"));

      // Verify the title was actually updated
      const updated = await mockConversationService.getConversation(
        conversation.id
      );
      assert.strictEqual(updated!.title, "Updated Title");
    });

    it("should return 404 for non-existent conversation", async () => {
      const response = await request(app)
        .put("/api/conversations/non-existent/title")
        .send({ title: "New Title" })
        .expect(404);

      assert.ok(response.body.error.includes("Conversation not found"));
    });

    it("should reject empty title", async () => {
      const conversation = await mockConversationService.createConversation({
        title: "Original",
      });

      const response = await request(app)
        .put(`/api/conversations/${conversation.id}/title`)
        .send({ title: "" })
        .expect(400);

      assert.ok(response.body.error.includes("Title is required"));
    });

    it("should trim whitespace from title", async () => {
      const conversation = await mockConversationService.createConversation({
        title: "Original",
      });

      await request(app)
        .put(`/api/conversations/${conversation.id}/title`)
        .send({ title: "  Updated Title  " })
        .expect(200);

      const updated = await mockConversationService.getConversation(
        conversation.id
      );
      assert.strictEqual(updated!.title, "Updated Title");
    });
  });

  describe("DELETE /api/conversations/:id", () => {
    it("should delete conversation", async () => {
      const conversation = await mockConversationService.createConversation({
        title: "To Delete",
      });

      const response = await request(app)
        .delete(`/api/conversations/${conversation.id}`)
        .expect(200);

      assert.ok(response.body.success);
      assert.ok(response.body.message.includes("deleted successfully"));

      // Verify conversation was deleted
      const deleted = await mockConversationService.getConversation(
        conversation.id
      );
      assert.strictEqual(deleted, null);
    });

    it("should return 404 for non-existent conversation", async () => {
      const response = await request(app)
        .delete("/api/conversations/non-existent")
        .expect(404);

      assert.ok(response.body.error.includes("Conversation not found"));
    });
  });

  describe("POST /api/conversations/messages", () => {
    let conversationId: string;

    beforeEach(async () => {
      const conversation = await mockConversationService.createConversation({
        title: "Test Conv",
      });
      conversationId = conversation.id;
    });

    it("should save message to conversation", async () => {
      const messageData = {
        conversationId,
        role: "user",
        content: "Hello, world!",
        provider: "openai",
        model: "gpt-4",
      };

      const response = await request(app)
        .post("/api/conversations/messages")
        .send(messageData)
        .expect(201);

      assert.ok(response.body.success);
      assert.ok(response.body.message.includes("Message saved successfully"));
    });

    it("should save message without provider and model", async () => {
      const messageData = {
        conversationId,
        role: "system",
        content: "System message",
      };

      const response = await request(app)
        .post("/api/conversations/messages")
        .send(messageData)
        .expect(201);

      assert.ok(response.body.success);
    });

    it("should reject missing conversationId", async () => {
      const response = await request(app)
        .post("/api/conversations/messages")
        .send({
          role: "user",
          content: "Hello",
        })
        .expect(400);

      assert.ok(response.body.error.includes("Conversation ID is required"));
    });

    it("should reject invalid role", async () => {
      const response = await request(app)
        .post("/api/conversations/messages")
        .send({
          conversationId,
          role: "invalid",
          content: "Hello",
        })
        .expect(400);

      assert.ok(response.body.error.includes("Valid role is required"));
    });

    it("should reject empty content", async () => {
      const response = await request(app)
        .post("/api/conversations/messages")
        .send({
          conversationId,
          role: "user",
          content: "",
        })
        .expect(400);

      assert.ok(response.body.error.includes("Content is required"));
    });

    it("should reject missing content", async () => {
      const response = await request(app)
        .post("/api/conversations/messages")
        .send({
          conversationId,
          role: "user",
        })
        .expect(400);

      assert.ok(response.body.error.includes("Content is required"));
    });

    it("should accept all valid roles", async () => {
      const roles = ["user", "assistant", "system"];

      for (const role of roles) {
        const response = await request(app)
          .post("/api/conversations/messages")
          .send({
            conversationId,
            role,
            content: `${role} message`,
          })
          .expect(201);

        assert.ok(response.body.success);
      }
    });
  });

  describe("Error handling", () => {
    it("should handle malformed JSON", async () => {
      await request(app)
        .post("/api/conversations")
        .type("json")
        .send("{ invalid json")
        .expect(400);

      // The error handling will depend on your middleware implementation
    });

    it("should handle missing request body", async () => {
      const response = await request(app)
        .post("/api/conversations")
        .expect(400);

      assert.ok(response.body.error.includes("Title is required"));
    });

    it("should handle service errors gracefully", async () => {
      // This test would be more meaningful with actual service error injection
      // but demonstrates the pattern
      const response = await request(app)
        .put("/api/conversations/non-existent/title")
        .send({ title: "New Title" })
        .expect(404);

      assert.ok(response.body.error);
    });
  });
});
