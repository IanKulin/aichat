// test/database.test.ts - Database connection and schema tests

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import fs from "fs";
import path from "path";
import { getDatabase, closeDatabase } from "../lib/database.ts";

describe("Database Tests", () => {
  const testDbPath = path.join(process.cwd(), "data", "db", "test-chat.db");

  beforeEach(() => {
    // Ensure clean state for each test
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  afterEach(() => {
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe("Database connection", () => {
    it("should create database connection", () => {
      const db = getDatabase();
      assert.ok(db, "Database connection should be created");
      // Note: Database file location is determined by the module, not overrideable in tests
    });

    it("should return same instance on multiple calls", () => {
      const db1 = getDatabase();
      const db2 = getDatabase();
      assert.strictEqual(db1, db2, "Should return same database instance");
    });

    it("should close database connection properly", () => {
      const db = getDatabase();
      assert.ok(db, "Database should be connected");

      closeDatabase();
      // After closing, a new call should create a new instance
      const newDb = getDatabase();
      assert.ok(newDb, "Should create new database instance after close");
    });
  });

  describe("Database schema", () => {
    it("should create conversations table with correct structure", () => {
      const db = getDatabase();

      const tableInfo = db
        .prepare(
          `
        PRAGMA table_info(conversations)
      `
        )
        .all();

      const columns = tableInfo.map((col: any) => ({
        name: col.name,
        type: col.type,
        pk: col.pk === 1,
        notnull: col.notnull === 1,
      }));

      const expectedColumns = [
        { name: "id", type: "TEXT", pk: true, notnull: false }, // SQLite PRIMARY KEY doesn't enforce NOT NULL automatically for TEXT
        { name: "title", type: "TEXT", pk: false, notnull: true },
        { name: "created_at", type: "INTEGER", pk: false, notnull: true },
        { name: "updated_at", type: "INTEGER", pk: false, notnull: true },
      ];

      assert.deepStrictEqual(
        columns,
        expectedColumns,
        "Conversations table structure should match expected"
      );
    });

    it("should create messages table with correct structure", () => {
      const db = getDatabase();

      const tableInfo = db
        .prepare(
          `
        PRAGMA table_info(messages)
      `
        )
        .all();

      const columns = tableInfo.map((col: any) => ({
        name: col.name,
        type: col.type,
        pk: col.pk === 1,
        notnull: col.notnull === 1,
      }));

      const expectedColumns = [
        { name: "id", type: "INTEGER", pk: true, notnull: false }, // AUTOINCREMENT primary key
        { name: "conversation_id", type: "TEXT", pk: false, notnull: true },
        { name: "role", type: "TEXT", pk: false, notnull: true },
        { name: "content", type: "TEXT", pk: false, notnull: true },
        { name: "timestamp", type: "INTEGER", pk: false, notnull: true },
        { name: "provider", type: "TEXT", pk: false, notnull: false },
        { name: "model", type: "TEXT", pk: false, notnull: false },
      ];

      assert.deepStrictEqual(
        columns,
        expectedColumns,
        "Messages table structure should match expected"
      );
    });

    it("should create proper indexes", () => {
      const db = getDatabase();

      const indexes = db
        .prepare(
          `
        SELECT name, sql FROM sqlite_master 
        WHERE type = 'index' AND name LIKE 'idx_%'
      `
        )
        .all();

      const indexNames = indexes.map((idx: any) => idx.name);

      assert.ok(
        indexNames.includes("idx_conversations_updated_at"),
        "Should have conversations updated_at index"
      );
      assert.ok(
        indexNames.includes("idx_messages_conversation_id"),
        "Should have messages conversation_id index"
      );
    });

    it("should enforce role check constraint", () => {
      const db = getDatabase();

      // Insert valid conversation
      const insertValid = db.prepare(`
        INSERT INTO conversations (id, title, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `);
      const conversationId = `test-conv-${Date.now()}`; // Make unique
      insertValid.run(conversationId, "Test", Date.now(), Date.now());

      const insertMessage = db.prepare(`
        INSERT INTO messages (conversation_id, role, content, timestamp)
        VALUES (?, ?, ?, ?)
      `);

      // Valid roles should work
      insertMessage.run(conversationId, "user", "Hello", Date.now());
      insertMessage.run(conversationId, "assistant", "Hi", Date.now());
      insertMessage.run(conversationId, "system", "System message", Date.now());

      // Invalid role should fail
      assert.throws(() => {
        insertMessage.run(conversationId, "invalid", "Bad role", Date.now());
      }, /CHECK constraint failed/);
    });

    it("should enforce foreign key constraint", () => {
      const db = getDatabase();

      // Enable foreign key constraints for this test
      db.pragma("foreign_keys = ON");

      const insertMessage = db.prepare(`
        INSERT INTO messages (conversation_id, role, content, timestamp)
        VALUES (?, ?, ?, ?)
      `);

      // Insert message with non-existent conversation should fail
      assert.throws(() => {
        insertMessage.run("non-existent", "user", "Hello", Date.now());
      }, /FOREIGN KEY constraint failed/);
    });
  });

  describe("WAL mode configuration", () => {
    it("should enable WAL journal mode", () => {
      const db = getDatabase();

      const journalMode = db.pragma("journal_mode", { simple: true }) as string;
      assert.strictEqual(journalMode, "wal", "Should use WAL journal mode");
    });
  });
});
