// repositories/ChatRepository.ts - Data access layer for chat conversations and messages

import type { ChatMessage } from "../lib/types.ts";

export type Conversation = {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ConversationWithMessageCount = Conversation & {
  messageCount: number;
};

export type PersistedMessage = ChatMessage & {
  id: number;
  conversationId: string;
  timestamp: Date;
  provider?: string;
  model?: string;
};

export type ConversationWithMessages = Conversation & {
  messages: PersistedMessage[];
};

export type CreateConversationData = {
  title: string;
};

export type SaveMessageData = {
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  provider?: string;
  model?: string;
};

export abstract class ChatRepository {
  abstract createConversation(data: CreateConversationData): Promise<Conversation>;
  abstract getConversation(id: string): Promise<ConversationWithMessages | null>;
  abstract listConversations(limit?: number, offset?: number): Promise<ConversationWithMessageCount[]>;
  abstract updateConversationTitle(id: string, title: string): Promise<void>;
  abstract deleteConversation(id: string): Promise<void>;
  abstract saveMessage(data: SaveMessageData): Promise<PersistedMessage>;
  abstract getMessages(conversationId: string, limit?: number): Promise<PersistedMessage[]>;
  abstract deleteMessage(messageId: number): Promise<void>;
  abstract getConversationCount(): Promise<number>;
  abstract deleteOldConversations(olderThanTimestamp: number): Promise<number>;
}