// repositories/SqliteChatRepository.ts - SQLite implementation of ChatRepository

import { randomUUID } from "crypto";
import type { Database } from "better-sqlite3";
import { getDatabase } from "../lib/database.ts";
import {
  ChatRepository,
  type Conversation,
  type PersistedMessage,
  type ConversationWithMessages,
  type CreateConversationData,
  type SaveMessageData,
} from "./ChatRepository.ts";

interface ConversationRow {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
}

interface MessageRow {
  id: number;
  conversation_id: string;
  role: string;
  content: string;
  timestamp: number;
  provider: string | null;
  model: string | null;
}

export class SqliteChatRepository extends ChatRepository {
  private db: Database;

  constructor() {
    super();
    this.db = getDatabase();
  }

  async createConversation(data: CreateConversationData): Promise<Conversation> {
    const id = randomUUID();
    const now = Date.now();
    
    const stmt = this.db.prepare(`
      INSERT INTO conversations (id, title, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(id, data.title, now, now);
    
    return {
      id,
      title: data.title,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
  }

  async getConversation(id: string): Promise<ConversationWithMessages | null> {
    const conversationStmt = this.db.prepare(`
      SELECT id, title, created_at, updated_at
      FROM conversations
      WHERE id = ?
    `);
    
    const conversationRow = conversationStmt.get(id) as ConversationRow | undefined;
    
    if (!conversationRow) {
      return null;
    }
    
    const messagesStmt = this.db.prepare(`
      SELECT id, conversation_id, role, content, timestamp, provider, model
      FROM messages
      WHERE conversation_id = ?
      ORDER BY timestamp ASC
    `);
    
    const messageRows = messagesStmt.all(id) as MessageRow[];
    
    const conversation: Conversation = {
      id: conversationRow.id,
      title: conversationRow.title,
      createdAt: new Date(conversationRow.created_at),
      updatedAt: new Date(conversationRow.updated_at),
    };
    
    const messages: PersistedMessage[] = messageRows.map(row => ({
      id: row.id,
      conversationId: row.conversation_id,
      role: row.role as "user" | "assistant" | "system",
      content: row.content,
      timestamp: new Date(row.timestamp),
      provider: row.provider || undefined,
      model: row.model || undefined,
    }));
    
    return {
      ...conversation,
      messages,
    };
  }

  async listConversations(limit = 50, offset = 0): Promise<Conversation[]> {
    const stmt = this.db.prepare(`
      SELECT id, title, created_at, updated_at
      FROM conversations
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?
    `);
    
    const rows = stmt.all(limit, offset) as ConversationRow[];
    
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  async updateConversationTitle(id: string, title: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE conversations
      SET title = ?, updated_at = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(title, Date.now(), id);
    
    if (result.changes === 0) {
      throw new Error(`Conversation with id ${id} not found`);
    }
  }

  async deleteConversation(id: string): Promise<void> {
    // Start a transaction to delete both conversation and messages
    const deleteMessages = this.db.prepare(`
      DELETE FROM messages WHERE conversation_id = ?
    `);
    
    const deleteConversation = this.db.prepare(`
      DELETE FROM conversations WHERE id = ?
    `);
    
    const transaction = this.db.transaction(() => {
      deleteMessages.run(id);
      const result = deleteConversation.run(id);
      
      if (result.changes === 0) {
        throw new Error(`Conversation with id ${id} not found`);
      }
    });
    
    transaction();
  }

  async saveMessage(data: SaveMessageData): Promise<PersistedMessage> {
    const timestamp = Date.now();
    
    // Start a transaction to save message and update conversation timestamp
    const insertMessage = this.db.prepare(`
      INSERT INTO messages (conversation_id, role, content, timestamp, provider, model)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const updateConversation = this.db.prepare(`
      UPDATE conversations
      SET updated_at = ?
      WHERE id = ?
    `);
    
    const transaction = this.db.transaction(() => {
      const result = insertMessage.run(
        data.conversationId,
        data.role,
        data.content,
        timestamp,
        data.provider || null,
        data.model || null
      );
      
      updateConversation.run(timestamp, data.conversationId);
      
      return result.lastInsertRowid;
    });
    
    const messageId = transaction() as number;
    
    return {
      id: messageId,
      conversationId: data.conversationId,
      role: data.role,
      content: data.content,
      timestamp: new Date(timestamp),
      provider: data.provider,
      model: data.model,
    };
  }

  async getMessages(conversationId: string, limit = 1000): Promise<PersistedMessage[]> {
    const stmt = this.db.prepare(`
      SELECT id, conversation_id, role, content, timestamp, provider, model
      FROM messages
      WHERE conversation_id = ?
      ORDER BY timestamp ASC
      LIMIT ?
    `);
    
    const rows = stmt.all(conversationId, limit) as MessageRow[];
    
    return rows.map(row => ({
      id: row.id,
      conversationId: row.conversation_id,
      role: row.role as "user" | "assistant" | "system",
      content: row.content,
      timestamp: new Date(row.timestamp),
      provider: row.provider || undefined,
      model: row.model || undefined,
    }));
  }

  async deleteMessage(messageId: number): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM messages WHERE id = ?
    `);
    
    const result = stmt.run(messageId);
    
    if (result.changes === 0) {
      throw new Error(`Message with id ${messageId} not found`);
    }
  }

  async getConversationCount(): Promise<number> {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM conversations
    `);
    
    const result = stmt.get() as { count: number };
    return result.count;
  }
}