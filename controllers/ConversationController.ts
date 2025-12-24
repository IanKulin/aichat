// controllers/ConversationController.ts - Conversation management controller

import { type Request, type Response } from "express";
import { ChatService } from "../services/ChatService.ts";
import type { SaveMessageData } from "../repositories/ChatRepository.ts";

interface CreateConversationRequest {
  title: string;
}

interface SaveMessageRequest extends SaveMessageData {}

interface UpdateConversationTitleRequest {
  title: string;
}

export abstract class ConversationController {
  abstract createConversation(req: Request, res: Response): Promise<void>;
  abstract getConversation(req: Request, res: Response): Promise<void>;
  abstract listConversations(req: Request, res: Response): Promise<void>;
  abstract updateConversationTitle(req: Request, res: Response): Promise<void>;
  abstract deleteConversation(req: Request, res: Response): Promise<void>;
  abstract saveMessage(req: Request, res: Response): Promise<void>;
  abstract cleanupOldConversations?(req: Request, res: Response): Promise<void>;
}

export class DefaultConversationController extends ConversationController {
  private chatService: ChatService;

  constructor(chatService: ChatService) {
    super();
    this.chatService = chatService;
  }

  async createConversation(req: Request, res: Response): Promise<void> {
    const { title }: CreateConversationRequest = req.body;
    
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ error: "Title is required and must be a non-empty string" });
      return;
    }

    const conversation = await this.chatService.createConversation!({ title: title.trim() });
    res.status(201).json(conversation);
  }

  async getConversation(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: "Conversation ID is required" });
      return;
    }

    const conversation = await this.chatService.getConversation!(id);
    
    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    res.json(conversation);
  }

  async listConversations(req: Request, res: Response): Promise<void> {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    if (isNaN(limit) || limit < 1 || limit > 100) {
      res.status(400).json({ error: "Limit must be a number between 1 and 100" });
      return;
    }

    if (isNaN(offset) || offset < 0) {
      res.status(400).json({ error: "Offset must be a non-negative number" });
      return;
    }

    const conversations = await this.chatService.listConversations!(limit, offset);
    res.json({ conversations, limit, offset });
  }

  async updateConversationTitle(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { title }: UpdateConversationTitleRequest = req.body;

    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: "Conversation ID is required" });
      return;
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ error: "Title is required and must be a non-empty string" });
      return;
    }

    try {
      await this.chatService.updateConversationTitle!(id, title.trim());
      res.json({ success: true, message: "Conversation title updated successfully" });
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        res.status(404).json({ error: "Conversation not found" });
        return;
      }
      throw error;
    }
  }

  async deleteConversation(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: "Conversation ID is required" });
      return;
    }

    try {
      await this.chatService.deleteConversation!(id);
      res.json({ success: true, message: "Conversation deleted successfully" });
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        res.status(404).json({ error: "Conversation not found" });
        return;
      }
      throw error;
    }
  }

  async saveMessage(req: Request, res: Response): Promise<void> {
    const messageData: SaveMessageRequest = req.body;

    if (!messageData.conversationId || typeof messageData.conversationId !== 'string') {
      res.status(400).json({ error: "Conversation ID is required" });
      return;
    }

    if (!messageData.role || !['user', 'assistant', 'system'].includes(messageData.role)) {
      res.status(400).json({ error: "Valid role is required (user, assistant, or system)" });
      return;
    }

    if (!messageData.content || typeof messageData.content !== 'string' || messageData.content.trim().length === 0) {
      res.status(400).json({ error: "Content is required and must be a non-empty string" });
      return;
    }

    await this.chatService.saveMessageToConversation!(messageData);
    res.status(201).json({ success: true, message: "Message saved successfully" });
  }

  async cleanupOldConversations(req: Request, res: Response): Promise<void> {
    const retentionDays = req.query.days
      ? parseInt(req.query.days as string, 10)
      : parseInt(process.env.CHAT_RETENTION_DAYS || '90', 10);

    if (isNaN(retentionDays) || retentionDays < 1) {
      res.status(400).json({ error: "Retention days must be a positive number" });
      return;
    }

    const deletedCount = await this.chatService.cleanupOldConversations!(retentionDays);
    res.json({
      success: true,
      deletedCount,
      retentionDays,
      message: `Deleted ${deletedCount} conversations older than ${retentionDays} days`
    });
  }
}