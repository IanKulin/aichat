// test/repositories/SqliteChatRepository.test.ts - Tests for SQLite chat repository

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import fs from "fs";
import path from "path";
import { SqliteChatRepository } from "../../repositories/SqliteChatRepository.ts";
import { closeDatabase, getDatabase } from "../../lib/database.ts";

describe("SqliteChatRepository Tests", () => {
  let repository: SqliteChatRepository;
  const testDbPath = path.join(process.cwd(), "data", "db", "test-chat.db");

  beforeEach(async () => {
    // Clean slate for each test
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    // Clean up the main db path too if it exists from previous tests
    const mainDbPath = path.join(process.cwd(), "data", "db", "chat.db");
    if (fs.existsSync(mainDbPath)) {
      fs.unlinkSync(mainDbPath);
    }
    repository = new SqliteChatRepository();
  });

  afterEach(async () => {
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    const mainDbPath = path.join(process.cwd(), "data", "db", "chat.db");
    if (fs.existsSync(mainDbPath)) {
      fs.unlinkSync(mainDbPath);
    }
  });

  describe("Conversation CRUD operations", () => {
    it("should create a new conversation", async () => {
      const conversationData = { title: "Test Conversation" };
      
      const conversation = await repository.createConversation(conversationData);
      
      assert.ok(conversation.id, "Conversation should have an ID");
      assert.strictEqual(conversation.title, "Test Conversation");
      assert.ok(conversation.createdAt instanceof Date, "Should have createdAt date");
      assert.ok(conversation.updatedAt instanceof Date, "Should have updatedAt date");
      assert.strictEqual(conversation.createdAt.getTime(), conversation.updatedAt.getTime(), "Created and updated times should be equal initially");
    });

    it("should generate unique IDs for different conversations", async () => {
      const conv1 = await repository.createConversation({ title: "Conv 1" });
      const conv2 = await repository.createConversation({ title: "Conv 2" });
      
      assert.notStrictEqual(conv1.id, conv2.id, "Conversations should have unique IDs");
    });

    it("should retrieve a conversation by ID", async () => {
      const created = await repository.createConversation({ title: "Test Conversation" });
      
      const retrieved = await repository.getConversation(created.id);
      
      assert.ok(retrieved, "Should retrieve the conversation");
      assert.strictEqual(retrieved!.id, created.id);
      assert.strictEqual(retrieved!.title, "Test Conversation");
      assert.deepStrictEqual(retrieved!.messages, [], "New conversation should have no messages");
    });

    it("should return null for non-existent conversation", async () => {
      const result = await repository.getConversation("non-existent-id");
      assert.strictEqual(result, null, "Should return null for non-existent conversation");
    });

    it("should list conversations ordered by updated_at DESC", async () => {
      // Create conversations with slight delays to ensure different timestamps
      await repository.createConversation({ title: "First" });
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await repository.createConversation({ title: "Second" });
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await repository.createConversation({ title: "Third" });
      
      const conversations = await repository.listConversations();
      
      assert.strictEqual(conversations.length, 3, "Should return all conversations");
      assert.strictEqual(conversations[0].title, "Third", "Most recent should be first");
      assert.strictEqual(conversations[1].title, "Second", "Second most recent should be second");
      assert.strictEqual(conversations[2].title, "First", "Oldest should be last");
    });

    it("should respect limit and offset parameters", async () => {
      // Create 5 conversations
      for (let i = 1; i <= 5; i++) {
        await repository.createConversation({ title: `Conversation ${i}` });
        await new Promise(resolve => setTimeout(resolve, 5)); // Ensure different timestamps
      }
      
      const page1 = await repository.listConversations(2, 0);
      const page2 = await repository.listConversations(2, 2);
      
      assert.strictEqual(page1.length, 2, "First page should have 2 items");
      assert.strictEqual(page2.length, 2, "Second page should have 2 items");
      assert.notStrictEqual(page1[0].id, page2[0].id, "Pages should have different conversations");
    });

    it("should update conversation title", async () => {
      const conversation = await repository.createConversation({ title: "Original Title" });
      const originalUpdatedAt = conversation.updatedAt;
      
      await new Promise(resolve => setTimeout(resolve, 10)); // Ensure different timestamp
      await repository.updateConversationTitle(conversation.id, "Updated Title");
      
      const updated = await repository.getConversation(conversation.id);
      
      assert.strictEqual(updated!.title, "Updated Title", "Title should be updated");
      assert.ok(updated!.updatedAt > originalUpdatedAt, "Updated timestamp should be newer");
    });

    it("should throw error when updating non-existent conversation title", async () => {
      await assert.rejects(
        async () => await repository.updateConversationTitle("non-existent", "New Title"),
        /Conversation with id non-existent not found/,
        "Should throw error for non-existent conversation"
      );
    });

    it("should delete conversation and its messages", async () => {
      const conversation = await repository.createConversation({ title: "To Delete" });
      
      // Add a message to the conversation
      await repository.saveMessage({
        conversationId: conversation.id,
        role: "user",
        content: "Test message",
        provider: "test",
        model: "test-model"
      });
      
      await repository.deleteConversation(conversation.id);
      
      const deleted = await repository.getConversation(conversation.id);
      assert.strictEqual(deleted, null, "Conversation should be deleted");
      
      // Verify messages are also deleted
      const messages = await repository.getMessages(conversation.id);
      assert.strictEqual(messages.length, 0, "Messages should also be deleted");
    });

    it("should throw error when deleting non-existent conversation", async () => {
      await assert.rejects(
        async () => await repository.deleteConversation("non-existent"),
        /Conversation with id non-existent not found/,
        "Should throw error for non-existent conversation"
      );
    });

    it("should count conversations correctly", async () => {
      const initialCount = await repository.getConversationCount();
      assert.strictEqual(initialCount, 0, "Should start with 0 conversations");
      
      await repository.createConversation({ title: "Conv 1" });
      await repository.createConversation({ title: "Conv 2" });
      
      const count = await repository.getConversationCount();
      assert.strictEqual(count, 2, "Should count 2 conversations");
    });
  });

  describe("Message CRUD operations", () => {
    let conversationId: string;

    beforeEach(async () => {
      const conversation = await repository.createConversation({ title: "Test Conversation" });
      conversationId = conversation.id;
    });

    it("should save a message to conversation", async () => {
      const messageData = {
        conversationId,
        role: "user" as const,
        content: "Hello, world!",
        provider: "openai",
        model: "gpt-4"
      };
      
      const savedMessage = await repository.saveMessage(messageData);
      
      assert.ok(savedMessage.id, "Message should have an ID");
      assert.strictEqual(savedMessage.conversationId, conversationId);
      assert.strictEqual(savedMessage.role, "user");
      assert.strictEqual(savedMessage.content, "Hello, world!");
      assert.strictEqual(savedMessage.provider, "openai");
      assert.strictEqual(savedMessage.model, "gpt-4");
      assert.ok(savedMessage.timestamp instanceof Date, "Should have timestamp");
    });

    it("should save message without provider and model", async () => {
      const messageData = {
        conversationId,
        role: "system" as const,
        content: "System message"
      };
      
      const savedMessage = await repository.saveMessage(messageData);
      
      assert.strictEqual(savedMessage.provider, undefined);
      assert.strictEqual(savedMessage.model, undefined);
    });

    it("should update conversation timestamp when saving message", async () => {
      const originalConversation = await repository.getConversation(conversationId);
      const originalUpdatedAt = originalConversation!.updatedAt;
      
      await new Promise(resolve => setTimeout(resolve, 10)); // Ensure different timestamp
      
      await repository.saveMessage({
        conversationId,
        role: "user",
        content: "Test message"
      });
      
      const updatedConversation = await repository.getConversation(conversationId);
      assert.ok(updatedConversation!.updatedAt > originalUpdatedAt, "Conversation updated timestamp should be newer");
    });

    it("should retrieve messages for conversation in chronological order", async () => {
      await repository.saveMessage({
        conversationId,
        role: "user",
        content: "First message"
      });
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await repository.saveMessage({
        conversationId,
        role: "assistant",
        content: "Second message"
      });
      
      const messages = await repository.getMessages(conversationId);
      
      assert.strictEqual(messages.length, 2, "Should retrieve all messages");
      assert.strictEqual(messages[0].content, "First message", "First message should be first");
      assert.strictEqual(messages[1].content, "Second message", "Second message should be second");
      assert.ok(messages[0].timestamp <= messages[1].timestamp, "Messages should be in chronological order");
    });

    it("should include messages in conversation retrieval", async () => {
      await repository.saveMessage({
        conversationId,
        role: "user",
        content: "Hello"
      });
      
      await repository.saveMessage({
        conversationId,
        role: "assistant",
        content: "Hi there!"
      });
      
      const conversation = await repository.getConversation(conversationId);
      
      assert.strictEqual(conversation!.messages.length, 2, "Should include all messages");
      assert.strictEqual(conversation!.messages[0].content, "Hello");
      assert.strictEqual(conversation!.messages[1].content, "Hi there!");
    });

    it("should respect message limit parameter", async () => {
      // Save 5 messages
      for (let i = 1; i <= 5; i++) {
        await repository.saveMessage({
          conversationId,
          role: "user",
          content: `Message ${i}`
        });
      }
      
      const messages = await repository.getMessages(conversationId, 3);
      assert.strictEqual(messages.length, 3, "Should respect limit parameter");
    });

    it("should delete individual messages", async () => {
      const message = await repository.saveMessage({
        conversationId,
        role: "user",
        content: "To be deleted"
      });
      
      await repository.deleteMessage(message.id);
      
      const messages = await repository.getMessages(conversationId);
      assert.strictEqual(messages.length, 0, "Message should be deleted");
    });

    it("should throw error when deleting non-existent message", async () => {
      await assert.rejects(
        async () => await repository.deleteMessage(99999),
        /Message with id 99999 not found/,
        "Should throw error for non-existent message"
      );
    });

    it("should handle different role types", async () => {
      const roles: Array<"user" | "assistant" | "system"> = ["user", "assistant", "system"];
      
      for (const role of roles) {
        await repository.saveMessage({
          conversationId,
          role,
          content: `${role} message`
        });
      }
      
      const messages = await repository.getMessages(conversationId);
      assert.strictEqual(messages.length, 3, "Should save all role types");
      
      const savedRoles = messages.map(m => m.role);
      assert.deepStrictEqual(savedRoles, roles, "Should preserve role types");
    });
  });

  describe("Transaction handling", () => {
    it("should handle concurrent message saves correctly", async () => {
      const conversation = await repository.createConversation({ title: "Concurrent Test" });
      
      // Save multiple messages concurrently
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(repository.saveMessage({
          conversationId: conversation.id,
          role: "user",
          content: `Concurrent message ${i}`
        }));
      }
      
      const savedMessages = await Promise.all(promises);
      
      assert.strictEqual(savedMessages.length, 10, "All messages should be saved");
      
      const retrievedMessages = await repository.getMessages(conversation.id);
      assert.strictEqual(retrievedMessages.length, 10, "All messages should be retrievable");
    });

    it("should maintain data consistency during conversation deletion", async () => {
      const conversation = await repository.createConversation({ title: "Consistency Test" });

      // Add multiple messages
      for (let i = 0; i < 5; i++) {
        await repository.saveMessage({
          conversationId: conversation.id,
          role: "user",
          content: `Message ${i}`
        });
      }

      // Delete conversation should also delete all messages atomically
      await repository.deleteConversation(conversation.id);

      const deletedConversation = await repository.getConversation(conversation.id);
      const orphanedMessages = await repository.getMessages(conversation.id);

      assert.strictEqual(deletedConversation, null, "Conversation should be deleted");
      assert.strictEqual(orphanedMessages.length, 0, "Messages should also be deleted");
    });
  });

  describe("Cleanup operations", () => {
    it("should delete conversations older than threshold", async () => {
      // Create old conversation (91 days ago)
      const oldConv = await repository.createConversation({ title: "Old Conversation" });
      const oldTimestamp = Date.now() - (91 * 24 * 60 * 60 * 1000);

      // Manually update timestamp in DB to simulate old conversation
      const db = getDatabase();
      db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?')
        .run(oldTimestamp, oldConv.id);

      // Create recent conversation
      const recentConv = await repository.createConversation({ title: "Recent Conversation" });

      // Run cleanup with 90-day threshold
      const cutoff = Date.now() - (90 * 24 * 60 * 60 * 1000);
      const deletedCount = await repository.deleteOldConversations(cutoff);

      assert.strictEqual(deletedCount, 1, "Should delete 1 old conversation");

      // Verify old is gone, recent remains
      const oldResult = await repository.getConversation(oldConv.id);
      const recentResult = await repository.getConversation(recentConv.id);

      assert.strictEqual(oldResult, null, "Old conversation should be deleted");
      assert.ok(recentResult, "Recent conversation should remain");
    });

    it("should cascade delete messages with old conversations", async () => {
      // Create old conversation with messages
      const conv = await repository.createConversation({ title: "Old with messages" });
      await repository.saveMessage({
        conversationId: conv.id,
        role: "user",
        content: "Old message"
      });

      // Simulate old timestamp
      const oldTimestamp = Date.now() - (91 * 24 * 60 * 60 * 1000);
      const db = getDatabase();
      db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?')
        .run(oldTimestamp, conv.id);

      // Run cleanup
      const cutoff = Date.now() - (90 * 24 * 60 * 60 * 1000);
      await repository.deleteOldConversations(cutoff);

      // Verify messages are also deleted
      const messages = await repository.getMessages(conv.id);
      assert.strictEqual(messages.length, 0, "Messages should be cascade deleted");
    });

    it("should return 0 when no old conversations exist", async () => {
      await repository.createConversation({ title: "Recent" });

      const cutoff = Date.now() - (90 * 24 * 60 * 60 * 1000);
      const deletedCount = await repository.deleteOldConversations(cutoff);

      assert.strictEqual(deletedCount, 0, "Should delete 0 conversations");
    });

    it("should delete multiple old conversations", async () => {
      // Create 3 old conversations
      const oldTimestamp = Date.now() - (91 * 24 * 60 * 60 * 1000);
      const db = getDatabase();

      for (let i = 1; i <= 3; i++) {
        const conv = await repository.createConversation({ title: `Old ${i}` });
        db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?')
          .run(oldTimestamp, conv.id);
      }

      // Create 2 recent conversations
      await repository.createConversation({ title: "Recent 1" });
      await repository.createConversation({ title: "Recent 2" });

      // Run cleanup
      const cutoff = Date.now() - (90 * 24 * 60 * 60 * 1000);
      const deletedCount = await repository.deleteOldConversations(cutoff);

      assert.strictEqual(deletedCount, 3, "Should delete 3 old conversations");

      // Verify count
      const remainingCount = await repository.getConversationCount();
      assert.strictEqual(remainingCount, 2, "Should have 2 recent conversations remaining");
    });

    it("should handle cleanup with no conversations", async () => {
      const cutoff = Date.now() - (90 * 24 * 60 * 60 * 1000);
      const deletedCount = await repository.deleteOldConversations(cutoff);

      assert.strictEqual(deletedCount, 0, "Should handle empty database gracefully");
    });
  });
});