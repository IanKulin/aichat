// test/services/ConversationService.test.ts - Tests for ConversationService

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { DefaultConversationService } from "../../services/ConversationService.ts";
import type { ChatRepository } from "../../repositories/ChatRepository.ts";

// Mock implementation
class MockChatRepository implements ChatRepository {
  private conversations = new Map();
  private messages = new Map();
  private nextId = 1;

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

  async saveMessage(data: any) {
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

    return message;
  }

  async getMessages(conversationId: string, limit = 1000) {
    return Array.from(this.messages.values())
      .filter((msg: any) => msg.conversationId === conversationId)
      .sort((a: any, b: any) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(0, limit);
  }

  async deleteMessage(messageId: number) {
    if (!this.messages.has(messageId)) {
      throw new Error(`Message with id ${messageId} not found`);
    }
    this.messages.delete(messageId);
  }

  async getConversationCount() {
    return this.conversations.size;
  }

  async deleteOldConversations(cutoffTimestamp: number) {
    let deletedCount = 0;
    for (const [id, conversation] of this.conversations.entries()) {
      const convUpdated = (conversation as any).updatedAt;
      if (convUpdated && convUpdated.getTime() < cutoffTimestamp) {
        this.conversations.delete(id);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  async branchConversation(
    sourceConversationId: string,
    upToTimestamp: number,
    newTitle: string
  ) {
    const sourceConv = await this.getConversation(sourceConversationId);
    if (!sourceConv) {
      throw new Error(`Conversation with id ${sourceConversationId} not found`);
    }

    const filteredMessages = sourceConv.messages.filter(
      (msg: any) => msg.timestamp.getTime() <= upToTimestamp
    );

    if (filteredMessages.length === 0) {
      throw new Error(`No messages found up to timestamp ${upToTimestamp}`);
    }

    const newConv = await this.createConversation({ title: newTitle });

    for (const msg of filteredMessages) {
      await this.saveMessage({
        conversationId: newConv.id,
        role: msg.role,
        content: msg.content,
        provider: msg.provider,
        model: msg.model,
      });
    }

    return await this.getConversation(newConv.id);
  }
}

describe("ConversationService Tests", () => {
  let conversationService: DefaultConversationService;
  let mockRepository: MockChatRepository;

  beforeEach(() => {
    mockRepository = new MockChatRepository();
    conversationService = new DefaultConversationService(mockRepository);
  });

  describe("ConversationService with repository", () => {
    it("should create conversation through service", async () => {
      const conversationData = { title: "Test Conversation" };

      const conversation =
        await conversationService.createConversation(conversationData);

      assert.ok(conversation.id, "Should have conversation ID");
      assert.strictEqual(conversation.title, "Test Conversation");
      assert.ok(
        conversation.createdAt instanceof Date,
        "Should have created date"
      );
    });

    it("should retrieve conversation through service", async () => {
      const created = await conversationService.createConversation({
        title: "Test",
      });

      const retrieved = await conversationService.getConversation(created.id);

      assert.ok(retrieved, "Should retrieve conversation");
      assert.strictEqual(retrieved!.id, created.id);
      assert.strictEqual(retrieved!.title, "Test");
      assert.deepStrictEqual(
        retrieved!.messages,
        [],
        "Should have empty messages array"
      );
    });

    it("should list conversations through service", async () => {
      await conversationService.createConversation({ title: "Conv 1" });
      await conversationService.createConversation({ title: "Conv 2" });

      const conversations = await conversationService.listConversations();

      assert.strictEqual(
        conversations.length,
        2,
        "Should list all conversations"
      );
    });

    it("should update conversation title through service", async () => {
      const conversation = await conversationService.createConversation({
        title: "Original",
      });

      await conversationService.updateConversationTitle(
        conversation.id,
        "Updated"
      );

      const updated = await conversationService.getConversation(
        conversation.id
      );
      assert.strictEqual(updated!.title, "Updated", "Title should be updated");
    });

    it("should delete conversation through service", async () => {
      const conversation = await conversationService.createConversation({
        title: "To Delete",
      });

      await conversationService.deleteConversation(conversation.id);

      const deleted = await conversationService.getConversation(
        conversation.id
      );
      assert.strictEqual(deleted, null, "Conversation should be deleted");
    });

    it("should save message to conversation through service", async () => {
      const conversation = await conversationService.createConversation({
        title: "Test",
      });

      const messageData = {
        conversationId: conversation.id,
        role: "user" as const,
        content: "Hello",
        provider: "openai",
        model: "gpt-4",
      };

      await conversationService.saveMessageToConversation(messageData);

      const updated = await conversationService.getConversation(
        conversation.id
      );
      assert.strictEqual(
        updated!.messages.length,
        1,
        "Should have saved message"
      );
      assert.strictEqual(updated!.messages[0].content, "Hello");
    });

    it("should handle pagination in list conversations", async () => {
      // Create 5 conversations
      for (let i = 1; i <= 5; i++) {
        await conversationService.createConversation({ title: `Conv ${i}` });
      }

      const page1 = await conversationService.listConversations(2, 0);
      const page2 = await conversationService.listConversations(2, 2);

      assert.strictEqual(page1.length, 2, "First page should have 2 items");
      assert.strictEqual(page2.length, 2, "Second page should have 2 items");
      assert.notStrictEqual(
        page1[0].id,
        page2[0].id,
        "Pages should be different"
      );
    });

    it("should cleanup old conversations", async () => {
      // Create conversations
      await conversationService.createConversation({ title: "Conv 1" });
      await conversationService.createConversation({ title: "Conv 2" });

      // Simulate old conversations by deleting all within 0 days
      const deletedCount = await conversationService.cleanupOldConversations(0);

      assert.strictEqual(deletedCount, 2, "Should delete all conversations");
    });

    it("should branch conversation", async () => {
      const conversation = await conversationService.createConversation({
        title: "Original",
      });

      // Add messages
      const msg1 = await mockRepository.saveMessage({
        conversationId: conversation.id,
        role: "user",
        content: "Message 1",
        provider: "openai",
        model: "gpt-4",
      });

      await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay

      const _msg2 = await mockRepository.saveMessage({
        conversationId: conversation.id,
        role: "user",
        content: "Message 2",
        provider: "openai",
        model: "gpt-4",
      });

      // Branch at msg1 timestamp
      const branched = await conversationService.branchConversation(
        conversation.id,
        (msg1 as any).timestamp.getTime(),
        "Branched Conversation"
      );

      assert.ok(branched, "Should create branched conversation");
      assert.strictEqual(branched!.title, "Branched Conversation");
      assert.strictEqual(
        branched!.messages.length,
        1,
        "Should have only first message"
      );
      assert.strictEqual(branched!.messages[0].content, "Message 1");
    });
  });

  describe("Error propagation", () => {
    it("should propagate repository errors for conversation operations", async () => {
      // Test update non-existent conversation
      await assert.rejects(
        async () =>
          await conversationService.updateConversationTitle(
            "non-existent",
            "New Title"
          ),
        /Conversation with id non-existent not found/,
        "Should propagate repository errors"
      );

      // Test delete non-existent conversation
      await assert.rejects(
        async () =>
          await conversationService.deleteConversation("non-existent"),
        /Conversation with id non-existent not found/,
        "Should propagate repository errors"
      );
    });

    it("should handle repository errors gracefully", async () => {
      const conversation = await conversationService.createConversation({
        title: "Test",
      });

      // First deletion should succeed
      await conversationService.deleteConversation(conversation.id);

      // Second deletion should fail and propagate error
      await assert.rejects(
        async () =>
          await conversationService.deleteConversation(conversation.id),
        /Conversation with id .+ not found/,
        "Should propagate not found errors"
      );
    });
  });
});
