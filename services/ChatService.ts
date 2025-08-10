// services/ChatService.ts - Chat processing service

import { generateText, streamText } from "ai";
import { marked } from "marked";
import hljs from "highlight.js";
import { ProviderService } from "./ProviderService.ts";
import { ConfigService } from "./ConfigService.ts";

// Configure marked with highlight.js
marked.setOptions({
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
  langPrefix: 'hljs language-',
} as any);

// Import shared types
import type { SupportedProvider, ChatMessage } from "../lib/types.ts";

export type ChatResponse = {
  response: string;
  timestamp: string;
  provider: string;
  providerName: string;
  model: string;
}

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
  ): Promise<any>;
}

export class DefaultChatService extends ChatService {
  private providerService: ProviderService;
  private configService: ConfigService;

  constructor(
    providerService: ProviderService,
    configService: ConfigService
  ) {
    super();
    this.providerService = providerService;
    this.configService = configService;
  }

  async processMessage(
    messages: ChatMessage[],
    provider?: string,
    model?: string
  ): Promise<ChatResponse> {
    // Default to first available provider if none specified
    const availableProviders = this.providerService.getAvailableProviders();
    const selectedProvider = (provider || availableProviders[0]) as SupportedProvider;

    if (!this.providerService.validateProvider(selectedProvider)) {
      throw new Error(
        `Provider '${selectedProvider}' is not available. Available providers: ${availableProviders.join(", ")}`
      );
    }

    const providerConfig = this.configService.getProviderConfig(selectedProvider);
    const actualModel = model || providerConfig.defaultModel;

    try {
      const providerModel = this.providerService.getProviderModel(
        selectedProvider,
        actualModel
      );

      const result = await generateText({
        model: providerModel,
        messages,
        maxOutputTokens: 1000,
        temperature: 0.7,
      });

      // Convert markdown response to HTML with syntax highlighting
      const htmlResponse = await marked(result.text);

      return {
        response: htmlResponse,
        timestamp: new Date().toISOString(),
        provider: selectedProvider,
        providerName: providerConfig.name,
        model: actualModel,
      };
    } catch (error) {
      if (error instanceof Error) {
        // Enhance error messages for better debugging
        if (error.message.includes("API key")) {
          throw new Error(
            `${providerConfig.name} API key issue: ${error.message}`
          );
        }
        if (error.message.includes("model")) {
          throw new Error(
            `Model error for ${providerConfig.name}: ${error.message}`
          );
        }
        throw new Error(
          `${providerConfig.name} API error: ${error.message}`
        );
      }
      throw error;
    }
  }

  async streamMessage(
    messages: ChatMessage[],
    provider?: string,
    model?: string
  ) {
    // Default to first available provider if none specified
    const availableProviders = this.providerService.getAvailableProviders();
    const selectedProvider = (provider || availableProviders[0]) as SupportedProvider;

    if (!this.providerService.validateProvider(selectedProvider)) {
      throw new Error(
        `Provider '${selectedProvider}' is not available. Available providers: ${availableProviders.join(", ")}`
      );
    }

    const providerConfig = this.configService.getProviderConfig(selectedProvider);
    const actualModel = model || providerConfig.defaultModel;

    try {
      const providerModel = this.providerService.getProviderModel(
        selectedProvider,
        actualModel
      );

      const result = streamText({
        model: providerModel,
        messages,
        maxOutputTokens: 1000,
        temperature: 0.7,
      });

      return result.toUIMessageStreamResponse();
    } catch (error) {
      if (error instanceof Error) {
        // Enhanced error handling for streaming
        if (error.message.includes("API key")) {
          throw new Error(
            `${providerConfig.name} API key issue: ${error.message}`
          );
        }
        if (error.message.includes("model")) {
          throw new Error(
            `Model error for ${providerConfig.name}: ${error.message}`
          );
        }
        throw new Error(
          `${providerConfig.name} streaming error: ${error.message}`
        );
      }
      throw error;
    }
  }
}