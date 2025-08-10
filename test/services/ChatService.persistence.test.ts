// test/services/ChatService.persistence.test.ts - Tests for ChatService persistence methods

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { DefaultChatService } from "../../services/ChatService.ts";
import type { ProviderService } from "../../services/ProviderService.ts";
import type { ConfigService } from "../../services/ConfigService.ts";
import type { ChatRepository } from "../../repositories/ChatRepository.ts";
import type { SupportedProvider } from "../../lib/types.ts";

// Mock implementations
class MockProviderService implements ProviderService {
  getAvailableProviders(): string[] {
    return ["openai"];
  }

  validateProvider(_provider: SupportedProvider): boolean {
    return true;
  }

  getProviderModel(_provider: SupportedProvider, _model: string) {
    return {}; // Mock model
  }

  validateAllProviders() {
    return {
      openai: { valid: true, message: "Mock valid" }
    };
  }

  getProviderInfo(_provider: SupportedProvider) {
    return {
      id: "openai",
      name: "OpenAI",
      models: ["gpt-4"],
      defaultModel: "gpt-4"
    };
  }

  getAllProviderInfo() {
    return [this.getProviderInfo("openai")];
  }
}

class MockConfigService implements ConfigService {
  getProviderConfig(_provider: SupportedProvider) {
    return {
      name: "OpenAI",
      models: ["gpt-4"],
      defaultModel: "gpt-4"
    };
  }

  getAllProviderConfigs() {
    return {
      openai: this.getProviderConfig("openai")
    };
  }
}

class MockChatRepository implements ChatRepository {
  private conversations = new Map();
  private messages = new Map();
  private nextId = 1;

  async createConversation(data: any) {
    const conversation = {
      id: `conv-${this.nextId++}`,
      title: data.title,
      createdAt: new Date(),
      updatedAt: new Date()
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
      messages: conversationMessages
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
      model: data.model
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
}

describe("ChatService Persistence Tests", () => {
  let chatService: DefaultChatService;
  let mockRepository: MockChatRepository;

  beforeEach(() => {
    const mockProviderService = new MockProviderService();
    const mockConfigService = new MockConfigService();
    mockRepository = new MockChatRepository();
    
    chatService = new DefaultChatService(
      mockProviderService,
      mockConfigService,
      mockRepository
    );
  });

  describe("ChatService with repository", () => {
    it("should create conversation through service", async () => {
      const conversationData = { title: "Test Conversation" };
      
      const conversation = await chatService.createConversation!(conversationData);
      
      assert.ok(conversation.id, "Should have conversation ID");
      assert.strictEqual(conversation.title, "Test Conversation");
      assert.ok(conversation.createdAt instanceof Date, "Should have created date");
    });

    it("should retrieve conversation through service", async () => {
      const created = await chatService.createConversation!({ title: "Test" });
      
      const retrieved = await chatService.getConversation!(created.id);
      
      assert.ok(retrieved, "Should retrieve conversation");
      assert.strictEqual(retrieved!.id, created.id);
      assert.strictEqual(retrieved!.title, "Test");
      assert.deepStrictEqual(retrieved!.messages, [], "Should have empty messages array");
    });

    it("should list conversations through service", async () => {
      await chatService.createConversation!({ title: "Conv 1" });
      await chatService.createConversation!({ title: "Conv 2" });
      
      const conversations = await chatService.listConversations!();
      
      assert.strictEqual(conversations.length, 2, "Should list all conversations");
    });

    it("should update conversation title through service", async () => {
      const conversation = await chatService.createConversation!({ title: "Original" });
      
      await chatService.updateConversationTitle!(conversation.id, "Updated");
      
      const updated = await chatService.getConversation!(conversation.id);
      assert.strictEqual(updated!.title, "Updated", "Title should be updated");
    });

    it("should delete conversation through service", async () => {
      const conversation = await chatService.createConversation!({ title: "To Delete" });
      
      await chatService.deleteConversation!(conversation.id);
      
      const deleted = await chatService.getConversation!(conversation.id);
      assert.strictEqual(deleted, null, "Conversation should be deleted");
    });

    it("should save message to conversation through service", async () => {
      const conversation = await chatService.createConversation!({ title: "Test" });
      
      const messageData = {
        conversationId: conversation.id,
        role: "user" as const,
        content: "Hello",
        provider: "openai",
        model: "gpt-4"
      };
      
      await chatService.saveMessageToConversation!(messageData);
      
      const updated = await chatService.getConversation!(conversation.id);
      assert.strictEqual(updated!.messages.length, 1, "Should have saved message");
      assert.strictEqual(updated!.messages[0].content, "Hello");
    });

    it("should handle pagination in list conversations", async () => {
      // Create 5 conversations
      for (let i = 1; i <= 5; i++) {
        await chatService.createConversation!({ title: `Conv ${i}` });
      }
      
      const page1 = await chatService.listConversations!(2, 0);
      const page2 = await chatService.listConversations!(2, 2);
      
      assert.strictEqual(page1.length, 2, "First page should have 2 items");
      assert.strictEqual(page2.length, 2, "Second page should have 2 items");
      assert.notStrictEqual(page1[0].id, page2[0].id, "Pages should be different");
    });
  });

  describe("ChatService without repository", () => {
    let serviceWithoutRepository: DefaultChatService;

    beforeEach(() => {
      const mockProviderService = new MockProviderService();
      const mockConfigService = new MockConfigService();
      
      // Create service without repository
      serviceWithoutRepository = new DefaultChatService(
        mockProviderService,
        mockConfigService
        // No repository passed
      );
    });

    it("should throw error when creating conversation without repository", async () => {
      await assert.rejects(
        async () => await serviceWithoutRepository.createConversation!({ title: "Test" }),
        /Chat repository not configured for persistence/,
        "Should throw error when repository not configured"
      );
    });

    it("should throw error when getting conversation without repository", async () => {
      await assert.rejects(
        async () => await serviceWithoutRepository.getConversation!("test-id"),
        /Chat repository not configured for persistence/,
        "Should throw error when repository not configured"
      );
    });

    it("should throw error when listing conversations without repository", async () => {
      await assert.rejects(
        async () => await serviceWithoutRepository.listConversations!(),
        /Chat repository not configured for persistence/,
        "Should throw error when repository not configured"
      );
    });

    it("should throw error when updating conversation title without repository", async () => {
      await assert.rejects(
        async () => await serviceWithoutRepository.updateConversationTitle!("test-id", "New Title"),
        /Chat repository not configured for persistence/,
        "Should throw error when repository not configured"
      );
    });

    it("should throw error when deleting conversation without repository", async () => {
      await assert.rejects(
        async () => await serviceWithoutRepository.deleteConversation!("test-id"),
        /Chat repository not configured for persistence/,
        "Should throw error when repository not configured"
      );
    });

    it("should throw error when saving message without repository", async () => {
      await assert.rejects(
        async () => await serviceWithoutRepository.saveMessageToConversation!({
          conversationId: "test",
          role: "user",
          content: "test"
        }),
        /Chat repository not configured for persistence/,
        "Should throw error when repository not configured"
      );
    });
  });

  describe("Error propagation", () => {
    it("should propagate repository errors for conversation operations", async () => {
      // Test update non-existent conversation
      await assert.rejects(
        async () => await chatService.updateConversationTitle!("non-existent", "New Title"),
        /Conversation with id non-existent not found/,
        "Should propagate repository errors"
      );

      // Test delete non-existent conversation
      await assert.rejects(
        async () => await chatService.deleteConversation!("non-existent"),
        /Conversation with id non-existent not found/,
        "Should propagate repository errors"
      );
    });

    it("should handle repository errors gracefully", async () => {
      const conversation = await chatService.createConversation!({ title: "Test" });
      
      // First deletion should succeed
      await chatService.deleteConversation!(conversation.id);
      
      // Second deletion should fail and propagate error
      await assert.rejects(
        async () => await chatService.deleteConversation!(conversation.id),
        /Conversation with id .+ not found/,
        "Should propagate not found errors"
      );
    });
  });

  describe("Integration with existing chat functionality", () => {
    it("should maintain backward compatibility with non-persistence methods", async () => {
      // These methods should still work even with persistence enabled
      // processMessage and streamMessage should still work
      // (Would need actual AI SDK mocking for full test, but we can verify they exist)
      assert.ok(typeof chatService.processMessage === "function", "processMessage should be available");
      assert.ok(typeof chatService.streamMessage === "function", "streamMessage should be available");
    });
  });
});