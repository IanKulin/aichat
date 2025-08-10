// lib/ai-client.ts - Backward compatibility layer using new services

import {
  getConfigService,
  getProviderService,
  getChatService,
} from "./services.ts";

// Import shared types
import type {
  SupportedProvider,
  ProviderConfig,
  ChatMessage,
  ApiKeyValidation,
} from "./types.ts";

// Backward compatibility exports
export const providerConfigs = getConfigService().getProviderConfigs();

export function validateApiKey(
  provider: SupportedProvider = "openai"
): ApiKeyValidation {
  try {
    return getProviderService().validateApiKey(provider);
  } catch {
    // For backward compatibility, return invalid result instead of throwing
    return {
      valid: false,
      message: `Unknown provider: ${provider}`,
    };
  }
}

// Get provider configuration
export function getProviderConfig(
  provider: SupportedProvider
): ProviderConfig | undefined {
  try {
    return getConfigService().getProviderConfig(provider);
  } catch {
    // For backward compatibility, return undefined instead of throwing
    return undefined;
  }
}

// Generate text (non-streaming) - backward compatible with existing code
export async function sendMessage(
  messages: ChatMessage[],
  provider: SupportedProvider = "openai",
  model?: string
): Promise<string> {
  const chatService = getChatService();
  const result = await chatService.processMessage(messages, provider, model);
  return result.response;
}

// Stream text (new feature for real-time responses)
export async function streamMessage(
  messages: ChatMessage[],
  provider: SupportedProvider = "openai",
  model?: string
) {
  const chatService = getChatService();
  return await chatService.streamMessage(messages, provider, model);
}
