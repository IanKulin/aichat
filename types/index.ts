// types/index.ts - Barrel export for all types

// ============================================================================
// Core domain types
// ============================================================================
export type { ChatMessage, ApiKeyValidation, ApiKeyStatus } from "./core.ts";

// ============================================================================
// Provider types
// ============================================================================
export type {
  SupportedProvider,
  ProviderConfig,
  ProviderInfo,
} from "./provider.ts";

// ============================================================================
// Repository types
// ============================================================================
export type {
  Conversation,
  ConversationWithMessageCount,
  PersistedMessage,
  ConversationWithMessages,
  CreateConversationData,
  SaveMessageData,
  ModelsConfig,
  ProviderInstance,
} from "./repositories.ts";

export {
  ChatRepository,
  ProviderRepository,
  ModelRepository,
} from "./repositories.ts";

export type { ISettingsRepository } from "./repositories.ts";

// ============================================================================
// Service types
// ============================================================================
export type { ChatResponse } from "./services.ts";

export {
  ChatService,
  ConfigService,
  ProviderService,
  ConversationService,
  SettingsService,
} from "./services.ts";

// ============================================================================
// Controller types
// ============================================================================
export type {
  ChatRequest,
  CreateConversationRequest,
  SaveMessageRequest,
  UpdateConversationTitleRequest,
  BranchConversationRequest,
} from "./controllers.ts";

export {
  ChatController,
  ConversationController,
  ProviderController,
  SettingsController,
  HealthController,
} from "./controllers.ts";

// ============================================================================
// Middleware types
// ============================================================================
export { ValidationError } from "./middleware.ts";
