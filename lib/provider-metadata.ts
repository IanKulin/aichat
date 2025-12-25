// lib/provider-metadata.ts - Backward compatibility re-exports
// NOTE: This file is deprecated. Import from types/provider.ts or lib/provider-constants.ts instead.

// Re-export type from types/provider.ts
export type { SupportedProvider } from "../types/provider.ts";

// Re-export runtime constants and functions from lib/provider-constants.ts
export {
  PROVIDER_METADATA,
  SUPPORTED_PROVIDERS,
  getProviderDisplayName,
  getProviderEnvVar,
  isValidProvider,
} from "./provider-constants.ts";
