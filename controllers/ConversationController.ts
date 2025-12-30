// controllers/ConversationController.ts - Conversation management controller

import { type Request, type Response } from "express";
import type { ConversationService } from "../types/services.ts";
import type {
  CreateConversationRequest,
  SaveMessageRequest,
  UpdateConversationTitleRequest,
  BranchConversationRequest,
} from "../types/controllers.ts";
import { ConversationController } from "../types/controllers.ts";

export type {
  CreateConversationRequest,
  SaveMessageRequest,
  UpdateConversationTitleRequest,
  BranchConversationRequest,
} from "../types/controllers.ts";
export { ConversationController };

export class DefaultConversationController extends ConversationController {
  private conversationService: ConversationService;

  constructor(conversationService: ConversationService) {
    super();
    this.conversationService = conversationService;
  }

  async createConversation(req: Request, res: Response): Promise<void> {
    const { title }: CreateConversationRequest = req.body;

    const conversation = await this.conversationService.createConversation({
      title,
    });
    res.status(201).json(conversation);
  }

  async getConversation(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const conversation = await this.conversationService.getConversation(id);

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    res.json(conversation);
  }

  async listConversations(req: Request, res: Response): Promise<void> {
    const limit = parseInt(req.query.limit as string, 10);
    const offset = parseInt(req.query.offset as string, 10);

    const conversations = await this.conversationService.listConversations(
      limit,
      offset
    );
    res.json({ conversations, limit, offset });
  }

  async updateConversationTitle(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { title }: UpdateConversationTitleRequest = req.body;

    try {
      await this.conversationService.updateConversationTitle(id, title);
      res.json({
        success: true,
        message: "Conversation title updated successfully",
      });
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

    try {
      await this.conversationService.deleteConversation(id);
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

    await this.conversationService.saveMessageToConversation(messageData);
    res
      .status(201)
      .json({ success: true, message: "Message saved successfully" });
  }

  async cleanupOldConversations(req: Request, res: Response): Promise<void> {
    const retentionDays = parseInt(req.query.days as string, 10);

    const deletedCount =
      await this.conversationService.cleanupOldConversations(retentionDays);
    res.json({
      success: true,
      deletedCount,
      retentionDays,
      message: `Deleted ${deletedCount} conversations older than ${retentionDays} days`,
    });
  }

  async branchConversation(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { upToTimestamp, newTitle }: BranchConversationRequest = req.body;

    try {
      const branchedConversation =
        await this.conversationService.branchConversation(
          id,
          upToTimestamp,
          newTitle
        );
      res.status(201).json(branchedConversation);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          res.status(404).json({ error: error.message });
          return;
        }
        if (
          error.message.includes("No messages found") ||
          error.message.includes("Invalid timestamp")
        ) {
          res.status(400).json({ error: error.message });
          return;
        }
      }
      throw error;
    }
  }
}
