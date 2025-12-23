// lib/database.ts - Database connection and initialization

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

export type DatabaseConnection = Database.Database;

// Use test database when NODE_ENV is 'test'
const dbFileName = process.env.NODE_ENV === "test" ? "test-chat.db" : "chat.db";
const DB_PATH = path.join(process.cwd(), "data", "db", dbFileName);

let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    // Ensure the database directory exists
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Initialize database connection
    dbInstance = new Database(DB_PATH);

    // Enable WAL mode for better concurrent performance
    dbInstance.pragma("journal_mode = WAL");

    // Initialize schema
    initializeSchema(dbInstance);
  }

  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

function initializeSchema(db: Database.Database): void {
  // Create conversations table
  const createConversationsTable = `
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `;

  // Create messages table
  const createMessagesTable = `
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      provider TEXT,
      model TEXT,
      FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
    )
  `;

  // Create indexes for better performance
  const createConversationUpdatedIndex = `
    CREATE INDEX IF NOT EXISTS idx_conversations_updated_at 
    ON conversations (updated_at DESC)
  `;

  const createMessagesConversationIndex = `
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
    ON messages (conversation_id, timestamp)
  `;

  // Execute schema creation
  db.exec(createConversationsTable);
  db.exec(createMessagesTable);
  db.exec(createConversationUpdatedIndex);
  db.exec(createMessagesConversationIndex);
}

// Database cleanup on process exit (safety net)
// Graceful shutdown is handled in server.ts
process.on("exit", () => {
  closeDatabase();
});
