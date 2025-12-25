// test/repositories/SqliteChatRepository.branch.test.ts - Tests for branch conversation functionality

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import fs from "fs";
import path from "path";
import { SqliteChatRepository } from "../../repositories/SqliteChatRepository.ts";
import { closeDatabase } from "../../lib/database.ts";

describe("SqliteChatRepository Branch Tests", () => {
  let repository: SqliteChatRepository;
  const testDbPath = path.join(process.cwd(), "data", "db", "test-chat.db");

  beforeEach(async () => {
    // Clean slate for each test
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
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

  describe("Branch conversation functionality", () => {
    it("should branch conversation with multiple messages", async () => {
      // Create a conversation with messages
      const conversation = await repository.createConversation({
        title: "Original Conversation",
      });

      const _msg1 = await repository.saveMessage({
        conversationId: conversation.id,
        role: "user",
        content: "First message",
        provider: "openai",
        model: "gpt-4",
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const msg2 = await repository.saveMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: "Second message",
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const _msg3 = await repository.saveMessage({
        conversationId: conversation.id,
        role: "user",
        content: "Third message",
      });

      // Branch from msg2's timestamp
      const branchedConversation = await repository.branchConversation(
        conversation.id,
        msg2.timestamp.getTime(),
        "Original Conversation (Branch)"
      );

      // Verify branched conversation
      assert.ok(
        branchedConversation.id,
        "Branched conversation should have an ID"
      );
      assert.notStrictEqual(
        branchedConversation.id,
        conversation.id,
        "Branch should have different ID"
      );
      assert.strictEqual(
        branchedConversation.title,
        "Original Conversation (Branch)"
      );
      assert.strictEqual(
        branchedConversation.messages.length,
        2,
        "Should have 2 messages"
      );
      assert.strictEqual(
        branchedConversation.messages[0].content,
        "First message"
      );
      assert.strictEqual(
        branchedConversation.messages[1].content,
        "Second message"
      );
      assert.strictEqual(branchedConversation.messages[0].provider, "openai");
      assert.strictEqual(branchedConversation.messages[0].model, "gpt-4");
    });

    it("should branch from first message timestamp", async () => {
      const conversation = await repository.createConversation({
        title: "Original",
      });

      const msg1 = await repository.saveMessage({
        conversationId: conversation.id,
        role: "user",
        content: "First message",
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await repository.saveMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: "Second message",
      });

      // Branch from first message
      const branchedConversation = await repository.branchConversation(
        conversation.id,
        msg1.timestamp.getTime(),
        "Original (Branch)"
      );

      assert.strictEqual(
        branchedConversation.messages.length,
        1,
        "Should have only 1 message"
      );
      assert.strictEqual(
        branchedConversation.messages[0].content,
        "First message"
      );
    });

    it("should branch from middle message timestamp", async () => {
      const conversation = await repository.createConversation({
        title: "Original",
      });

      await repository.saveMessage({
        conversationId: conversation.id,
        role: "user",
        content: "Message 1",
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const msg2 = await repository.saveMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: "Message 2",
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await repository.saveMessage({
        conversationId: conversation.id,
        role: "user",
        content: "Message 3",
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await repository.saveMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: "Message 4",
      });

      // Branch from second message
      const branchedConversation = await repository.branchConversation(
        conversation.id,
        msg2.timestamp.getTime(),
        "Original (Branch)"
      );

      assert.strictEqual(
        branchedConversation.messages.length,
        2,
        "Should have first 2 messages"
      );
      assert.strictEqual(branchedConversation.messages[0].content, "Message 1");
      assert.strictEqual(branchedConversation.messages[1].content, "Message 2");
    });

    it("should throw error for invalid conversation ID", async () => {
      await assert.rejects(
        async () => {
          await repository.branchConversation(
            "non-existent-id",
            Date.now(),
            "Branch Title"
          );
        },
        /not found/,
        "Should throw error for non-existent conversation"
      );
    });

    it("should throw error for invalid timestamp (zero)", async () => {
      const conversation = await repository.createConversation({
        title: "Original",
      });

      await assert.rejects(
        async () => {
          await repository.branchConversation(
            conversation.id,
            0,
            "Branch Title"
          );
        },
        /Invalid timestamp/,
        "Should throw error for zero timestamp"
      );
    });

    it("should throw error for negative timestamp", async () => {
      const conversation = await repository.createConversation({
        title: "Original",
      });

      await assert.rejects(
        async () => {
          await repository.branchConversation(
            conversation.id,
            -1000,
            "Branch Title"
          );
        },
        /Invalid timestamp/,
        "Should throw error for negative timestamp"
      );
    });

    it("should throw error for timestamp with no messages", async () => {
      const conversation = await repository.createConversation({
        title: "Original",
      });

      await repository.saveMessage({
        conversationId: conversation.id,
        role: "user",
        content: "Message",
      });

      // Use timestamp before any messages
      const timestampBeforeMessages = Date.now() - 1000000;

      await assert.rejects(
        async () => {
          await repository.branchConversation(
            conversation.id,
            timestampBeforeMessages,
            "Branch Title"
          );
        },
        /No messages found/,
        "Should throw error when no messages at or before timestamp"
      );
    });

    it("should throw error for empty title", async () => {
      const conversation = await repository.createConversation({
        title: "Original",
      });

      const msg = await repository.saveMessage({
        conversationId: conversation.id,
        role: "user",
        content: "Message",
      });

      await assert.rejects(
        async () => {
          await repository.branchConversation(
            conversation.id,
            msg.timestamp.getTime(),
            ""
          );
        },
        /cannot be empty/,
        "Should throw error for empty title"
      );
    });

    it("should verify new conversation has correct title with suffix", async () => {
      const conversation = await repository.createConversation({
        title: "My Chat",
      });

      const msg = await repository.saveMessage({
        conversationId: conversation.id,
        role: "user",
        content: "Message",
      });

      const branchedConversation = await repository.branchConversation(
        conversation.id,
        msg.timestamp.getTime(),
        "My Chat (Branch)"
      );

      assert.strictEqual(branchedConversation.title, "My Chat (Branch)");
    });

    it("should verify messages copied with correct role/content/provider/model", async () => {
      const conversation = await repository.createConversation({
        title: "Original",
      });

      await repository.saveMessage({
        conversationId: conversation.id,
        role: "user",
        content: "User message",
        provider: "anthropic",
        model: "claude-3",
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const msg2 = await repository.saveMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: "Assistant message",
        provider: "openai",
        model: "gpt-4",
      });

      const branchedConversation = await repository.branchConversation(
        conversation.id,
        msg2.timestamp.getTime(),
        "Original (Branch)"
      );

      assert.strictEqual(branchedConversation.messages[0].role, "user");
      assert.strictEqual(
        branchedConversation.messages[0].content,
        "User message"
      );
      assert.strictEqual(
        branchedConversation.messages[0].provider,
        "anthropic"
      );
      assert.strictEqual(branchedConversation.messages[0].model, "claude-3");

      assert.strictEqual(branchedConversation.messages[1].role, "assistant");
      assert.strictEqual(
        branchedConversation.messages[1].content,
        "Assistant message"
      );
      assert.strictEqual(branchedConversation.messages[1].provider, "openai");
      assert.strictEqual(branchedConversation.messages[1].model, "gpt-4");
    });

    it("should verify messages have preserved relative timing", async () => {
      const conversation = await repository.createConversation({
        title: "Original",
      });

      const msg1 = await repository.saveMessage({
        conversationId: conversation.id,
        role: "user",
        content: "Message 1",
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const msg2 = await repository.saveMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: "Message 2",
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const msg3 = await repository.saveMessage({
        conversationId: conversation.id,
        role: "user",
        content: "Message 3",
      });

      const branchedConversation = await repository.branchConversation(
        conversation.id,
        msg3.timestamp.getTime(),
        "Original (Branch)"
      );

      // Calculate time differences
      const originalDiff1 = msg2.timestamp.getTime() - msg1.timestamp.getTime();
      const originalDiff2 = msg3.timestamp.getTime() - msg2.timestamp.getTime();

      const branchedDiff1 =
        branchedConversation.messages[1].timestamp.getTime() -
        branchedConversation.messages[0].timestamp.getTime();
      const branchedDiff2 =
        branchedConversation.messages[2].timestamp.getTime() -
        branchedConversation.messages[1].timestamp.getTime();

      // Relative timing should be preserved (allowing small margin for rounding)
      assert.ok(
        Math.abs(originalDiff1 - branchedDiff1) < 5,
        "First time difference should be preserved"
      );
      assert.ok(
        Math.abs(originalDiff2 - branchedDiff2) < 5,
        "Second time difference should be preserved"
      );
    });

    it("should verify original conversation remains unchanged after branching", async () => {
      const conversation = await repository.createConversation({
        title: "Original",
      });

      await repository.saveMessage({
        conversationId: conversation.id,
        role: "user",
        content: "Message 1",
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const msg2 = await repository.saveMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: "Message 2",
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await repository.saveMessage({
        conversationId: conversation.id,
        role: "user",
        content: "Message 3",
      });

      // Branch from middle
      await repository.branchConversation(
        conversation.id,
        msg2.timestamp.getTime(),
        "Original (Branch)"
      );

      // Verify original still has all messages
      const originalConversation = await repository.getConversation(
        conversation.id
      );

      assert.ok(
        originalConversation,
        "Original conversation should still exist"
      );
      assert.strictEqual(
        originalConversation!.title,
        "Original",
        "Original title should be unchanged"
      );
      assert.strictEqual(
        originalConversation!.messages.length,
        3,
        "Original should still have all 3 messages"
      );
    });
  });
});
