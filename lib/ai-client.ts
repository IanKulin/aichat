// lib/ai-client.ts - Streamlined interface to services

import {
  getChatService,
} from "./services.ts";

// Import shared types
import type {
  SupportedProvider,
  ChatMessage,
} from "./types.ts";

// Generate text (non-streaming)
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
