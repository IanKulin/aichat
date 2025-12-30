// controllers/ChatController.ts - Chat endpoint controller

import { type Request, type Response } from "express";
import type { ChatService } from "../types/services.ts";
import type { ProviderService } from "../types/services.ts";
import type { ConfigService } from "../types/services.ts";
import type {
  SupportedProvider,
  ChatMessage,
  ChatRequest,
} from "../types/index.ts";
import { logger } from "../lib/logger.ts";
import { ChatController } from "../types/controllers.ts";

export type { ChatRequest } from "../types/controllers.ts";
export { ChatController };

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

  private cleanTitleText(text: string): string {
    return text
      .replace(/<[^>]*>/g, "") // Remove all HTML tags
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&[^;]+;/g, "") // Remove any remaining HTML entities
      .replace(/[{}"]/g, "") // Remove JSON characters
      .trim();
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

  async generateTitle(req: Request, res: Response): Promise<void> {
    const { firstMessage, provider, model } = req.body;

    // Default provider selection
    const selectedProvider = provider || "openai";

    // Get the actual model that will be used
    const providerConfig = this.configService.getProviderConfig(
      selectedProvider as SupportedProvider
    );
    const actualModel = model || providerConfig.defaultModel;

    // Create title generation prompt
    const titlePrompt = `Summarise the following chat opening into a concise, descriptive title of 1–4 words. 
Do not add punctuation. Do not add extra text. Do not use HTML tags or formatting.
Respond only with plain text in this JSON format: {"title": "your title here"}.

Chat opening:
${firstMessage}`;

    const messages: ChatMessage[] = [{ role: "user", content: titlePrompt }];

    try {
      const aiResponse = await this.chatService.processMessage(
        messages,
        selectedProvider as SupportedProvider,
        actualModel
      );

      // Clean the response and try to parse JSON
      let cleanResponse = this.cleanTitleText(aiResponse.response);

      // Remove any markdown code block formatting
      cleanResponse = cleanResponse
        .replace(/^```json\s*/, "")
        .replace(/\s*```$/, "");

      try {
        const parsed = JSON.parse(cleanResponse);
        if (parsed.title && typeof parsed.title === "string") {
          const cleanTitle = this.cleanTitleText(parsed.title);
          res.json({ title: cleanTitle });
        } else {
          throw new Error("Invalid response format");
        }
      } catch {
        // Fallback: extract title from plain text response
        let fallbackTitle = cleanResponse
          .replace(/title\s*[:=]\s*/i, "") // Remove "title:" prefix
          .split("\n")[0]
          .substring(0, 50)
          .trim();

        fallbackTitle = this.cleanTitleText(fallbackTitle);
        res.json({ title: fallbackTitle || "Chat" });
      }
    } catch (error) {
      logger.error("Error generating title:", error);
      res.status(500).json({ error: "Failed to generate title" });
    }
  }
}
