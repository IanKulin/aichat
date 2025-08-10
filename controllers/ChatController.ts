// controllers/ChatController.ts - Chat endpoint controller

import { type Request, type Response } from "express";
import { ChatService } from "../services/ChatService.ts";
import { ProviderService } from "../services/ProviderService.ts";
import { ConfigService } from "../services/ConfigService.ts";
import type { SupportedProvider, ChatMessage } from "../lib/types.ts";

interface ChatRequest {
  messages: ChatMessage[];
  provider?: string;
  model?: string;
}

export abstract class ChatController {
  abstract processMessage(req: Request, res: Response): Promise<void>;
}

export class DefaultChatController extends ChatController {
  private chatService: ChatService;
  private providerService: ProviderService;
  private configService: ConfigService;

  constructor(
    chatService: ChatService,
    providerService: ProviderService,
    configService: ConfigService
  ) {
    super();
    this.chatService = chatService;
    this.providerService = providerService;
    this.configService = configService;
  }

  async processMessage(req: Request, res: Response): Promise<void> {
    const { messages, provider, model }: ChatRequest = req.body;

    // Default provider selection
    const selectedProvider = provider || "openai";

    // Get the actual model that will be used
    const providerConfig = this.configService.getProviderConfig(
      selectedProvider as SupportedProvider
    );
    const actualModel = model || providerConfig.defaultModel;

    // Send full conversation to selected provider
    const aiResponse = await this.chatService.processMessage(
      messages,
      selectedProvider as SupportedProvider,
      actualModel
    );

    // ChatService already returns the complete response object
    res.json(aiResponse);
  }
}