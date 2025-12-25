// services/ConversationService.ts - Conversation management service

import type {
  ChatRepository,
  Conversation,
  ConversationWithMessages,
  CreateConversationData,
  SaveMessageData
} from "../repositories/ChatRepository.ts";

export abstract class ConversationService {
  abstract createConversation(data: CreateConversationData): Promise<Conversation>;
  abstract getConversation(id: string): Promise<ConversationWithMessages | null>;
  abstract listConversations(limit?: number, offset?: number): Promise<Conversation[]>;
  abstract updateConversationTitle(id: string, title: string): Promise<void>;
  abstract deleteConversation(id: string): Promise<void>;
  abstract saveMessageToConversation(data: SaveMessageData): Promise<void>;
  abstract cleanupOldConversations(retentionDays: number): Promise<number>;
  abstract branchConversation(
    sourceConversationId: string,
    upToTimestamp: number,
    newTitle: string
  ): Promise<ConversationWithMessages>;
}

export class DefaultConversationService extends ConversationService {
  private chatRepository: ChatRepository;

  constructor(chatRepository: ChatRepository) {
    super();
    this.chatRepository = chatRepository;
  }

  async createConversation(data: CreateConversationData): Promise<Conversation> {
    return await this.chatRepository.createConversation(data);
  }

  async getConversation(id: string): Promise<ConversationWithMessages | null> {
    return await this.chatRepository.getConversation(id);
  }

  async listConversations(limit?: number, offset?: number): Promise<Conversation[]> {
    return await this.chatRepository.listConversations(limit, offset);
  }

  async updateConversationTitle(id: string, title: string): Promise<void> {
    await this.chatRepository.updateConversationTitle(id, title);
  }

  async deleteConversation(id: string): Promise<void> {
    await this.chatRepository.deleteConversation(id);
  }

  async saveMessageToConversation(data: SaveMessageData): Promise<void> {
    await this.chatRepository.saveMessage(data);
  }

  async cleanupOldConversations(retentionDays: number): Promise<number> {
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
    const cutoffTimestamp = Date.now() - retentionMs;

    const deletedCount = await this.chatRepository.deleteOldConversations(cutoffTimestamp);
    return deletedCount;
  }

  async branchConversation(
    sourceConversationId: string,
    upToTimestamp: number,
    newTitle: string
  ): Promise<ConversationWithMessages> {
    return await this.chatRepository.branchConversation(
      sourceConversationId,
      upToTimestamp,
      newTitle
    );
  }
}
