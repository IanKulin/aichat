// types/repositories.ts - Repository types and abstract classes

import type { LanguageModel } from "ai";
import type { ChatMessage } from "./core.ts";
import type { SupportedProvider, ProviderConfig } from "./provider.ts";
import type { ApiKeyValidation } from "./core.ts";

// ============================================================================
// Chat Repository Types
// ============================================================================

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
  abstract createConversation(
    data: CreateConversationData
  ): Promise<Conversation>;
  abstract getConversation(
    id: string
  ): Promise<ConversationWithMessages | null>;
  abstract listConversations(
    limit?: number,
    offset?: number
  ): Promise<ConversationWithMessageCount[]>;
  abstract updateConversationTitle(id: string, title: string): Promise<void>;
  abstract deleteConversation(id: string): Promise<void>;
  abstract saveMessage(data: SaveMessageData): Promise<PersistedMessage>;
  abstract getMessages(
    conversationId: string,
    limit?: number
  ): Promise<PersistedMessage[]>;
  abstract deleteMessage(messageId: number): Promise<void>;
  abstract getConversationCount(): Promise<number>;
  abstract deleteOldConversations(olderThanTimestamp: number): Promise<number>;
  abstract branchConversation(
    sourceConversationId: string,
    upToTimestamp: number,
    newTitle: string
  ): Promise<ConversationWithMessages>;
}

// ============================================================================
// Provider Repository Types
// ============================================================================

export type ProviderInstance = LanguageModel;

export abstract class ProviderRepository {
  abstract getProvider(
    provider: SupportedProvider,
    model: string
  ): ProviderInstance;
  abstract validateApiKey(provider: SupportedProvider): ApiKeyValidation;
  abstract hasValidApiKey(provider: SupportedProvider): boolean;
  abstract clearCache(): void;
  abstract reloadApiKeys(): void;
}

// ============================================================================
// Model Repository Types
// ============================================================================

export type ModelsConfig = {
  [key: string]: ProviderConfig;
};

export abstract class ModelRepository {
  abstract loadModelsConfig(): Record<string, ProviderConfig>;
  abstract validateModelsConfig(data: Record<string, unknown>): boolean;
}

// ============================================================================
// Settings Repository Types
// ============================================================================

export interface ISettingsRepository {
  getApiKey(provider: SupportedProvider): string | null;
  setApiKey(provider: SupportedProvider, key: string): void;
  getAllApiKeys(): Record<SupportedProvider, string | null>;
  deleteApiKey(provider: SupportedProvider): void;
}
