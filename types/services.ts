// types/services.ts - Service types and abstract classes

import type { ChatMessage } from "./core.ts";
import type {
  SupportedProvider,
  ProviderConfig,
  ProviderInfo,
} from "./provider.ts";
import type { ApiKeyValidation, ApiKeyStatus } from "./core.ts";
import type {
  Conversation,
  ConversationWithMessages,
  CreateConversationData,
  SaveMessageData,
} from "./repositories.ts";

// ============================================================================
// Chat Service Types
// ============================================================================

export type ChatResponse = {
  response: string;
  timestamp: string;
  provider: string;
  providerName: string;
  model: string;
};

export abstract class ChatService {
  abstract processMessage(
    messages: ChatMessage[],
    provider?: string,
    model?: string
  ): Promise<ChatResponse>;
  abstract streamMessage(
    messages: ChatMessage[],
    provider?: string,
    model?: string
  ): Promise<unknown>;
}

// ============================================================================
// Config Service Types
// ============================================================================

export abstract class ConfigService {
  abstract getProviderConfigs(): Record<string, ProviderConfig>;
  abstract getProviderConfig(provider: SupportedProvider): ProviderConfig;
  abstract validateConfiguration(): void;
}

// ============================================================================
// Provider Service Types
// ============================================================================

export abstract class ProviderService {
  abstract getAvailableProviders(): SupportedProvider[];
  abstract getProviderInfo(): ProviderInfo[];
  abstract validateProvider(provider: string): boolean;
  abstract getProviderModel(
    provider: SupportedProvider,
    model?: string
  ): unknown;
  abstract validateApiKey(provider: SupportedProvider): ApiKeyValidation;
  abstract validateAllProviders(): Record<SupportedProvider, ApiKeyValidation>;
}

// ============================================================================
// Conversation Service Types
// ============================================================================

export abstract class ConversationService {
  abstract createConversation(
    data: CreateConversationData
  ): Promise<Conversation>;
  abstract getConversation(
    id: string
  ): Promise<ConversationWithMessages | null>;
  abstract listConversations(
    limit?: number,
    offset?: number
  ): Promise<Conversation[]>;
  abstract updateConversationTitle(id: string, title: string): Promise<void>;
  abstract deleteConversation(id: string): Promise<void>;
  abstract saveMessageToConversation(data: SaveMessageData): Promise<void>;
  abstract cleanupOldConversations(retentionDays: number): Promise<number>;
  abstract branchConversation(
    sourceConversationId: string,
    upToTimestamp: number,
    newTitle: string
  ): Promise<ConversationWithMessages>;
}

// ============================================================================
// Settings Service Types
// ============================================================================

export abstract class SettingsService {
  abstract getApiKeys(): Promise<Record<SupportedProvider, ApiKeyStatus>>;
  abstract setApiKey(
    provider: SupportedProvider,
    key: string
  ): Promise<ApiKeyValidation>;
  abstract deleteApiKey(provider: SupportedProvider): Promise<void>;
}
