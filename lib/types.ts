// lib/types.ts - Backward compatibility re-exports
// NOTE: This file is deprecated. Import from types/index.ts instead.

// Re-export types from types/
export type {
  SupportedProvider,
  ProviderConfig,
  ProviderInfo,
} from "../types/provider.ts";
export type {
  ChatMessage,
  ApiKeyValidation,
  ApiKeyStatus,
} from "../types/core.ts";
