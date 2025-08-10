// services/ChatService.ts - Chat processing service

import { generateText, streamText, type LanguageModel } from "ai";
import { marked } from "marked";
import hljs from "highlight.js";
import { ProviderService } from "./ProviderService.ts";
import { ConfigService } from "./ConfigService.ts";

// Configure marked with highlight.js
marked.use({
  renderer: {
    code(token) {
      const code = token.text;
      const lang = token.lang;
      const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
      const highlighted = hljs.highlight(code, { language }).value;
      return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
    }
  }
});

// Import shared types
import type { SupportedProvider, ChatMessage } from "../lib/types.ts";
import type { ChatRepository, Conversation, ConversationWithMessages, CreateConversationData, SaveMessageData } from "../repositories/ChatRepository.ts";

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
  ): Promise<unknown>;
  
  // Conversation management methods (optional - may return null if not implemented)
  abstract createConversation?(data: CreateConversationData): Promise<Conversation>;
  abstract getConversation?(id: string): Promise<ConversationWithMessages | null>;
  abstract listConversations?(limit?: number, offset?: number): Promise<Conversation[]>;
  abstract updateConversationTitle?(id: string, title: string): Promise<void>;
  abstract deleteConversation?(id: string): Promise<void>;
  abstract saveMessageToConversation?(data: SaveMessageData): Promise<void>;
}

export class DefaultChatService extends ChatService {
  private providerService: ProviderService;
  private configService: ConfigService;
  private chatRepository?: ChatRepository;

  constructor(
    providerService: ProviderService,
    configService: ConfigService,
    chatRepository?: ChatRepository
  ) {
    super();
    this.providerService = providerService;
    this.configService = configService;
    this.chatRepository = chatRepository;
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
        model: providerModel as LanguageModel,
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
        model: providerModel as LanguageModel,
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

  // Conversation management methods
  async createConversation(data: CreateConversationData): Promise<Conversation> {
    if (!this.chatRepository) {
      throw new Error("Chat repository not configured for persistence");
    }
    return await this.chatRepository.createConversation(data);
  }

  async getConversation(id: string): Promise<ConversationWithMessages | null> {
    if (!this.chatRepository) {
      throw new Error("Chat repository not configured for persistence");
    }
    return await this.chatRepository.getConversation(id);
  }

  async listConversations(limit?: number, offset?: number): Promise<Conversation[]> {
    if (!this.chatRepository) {
      throw new Error("Chat repository not configured for persistence");
    }
    return await this.chatRepository.listConversations(limit, offset);
  }

  async updateConversationTitle(id: string, title: string): Promise<void> {
    if (!this.chatRepository) {
      throw new Error("Chat repository not configured for persistence");
    }
    await this.chatRepository.updateConversationTitle(id, title);
  }

  async deleteConversation(id: string): Promise<void> {
    if (!this.chatRepository) {
      throw new Error("Chat repository not configured for persistence");
    }
    await this.chatRepository.deleteConversation(id);
  }

  async saveMessageToConversation(data: SaveMessageData): Promise<void> {
    if (!this.chatRepository) {
      throw new Error("Chat repository not configured for persistence");
    }
    await this.chatRepository.saveMessage(data);
  }
}