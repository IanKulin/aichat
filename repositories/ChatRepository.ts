// repositories/ChatRepository.ts - Re-exports for backward compatibility
// NOTE: Import from types/repositories.ts instead

export type {
  Conversation,
  ConversationWithMessageCount,
  PersistedMessage,
  ConversationWithMessages,
  CreateConversationData,
  SaveMessageData,
} from "../types/repositories.ts";

export { ChatRepository } from "../types/repositories.ts";
