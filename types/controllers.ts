// types/controllers.ts - Controller types and abstract classes

import { type Request, type Response } from "express";
import type { ChatMessage } from "./core.ts";
import type { SaveMessageData } from "./repositories.ts";

// ============================================================================
// Request Types
// ============================================================================

export interface ChatRequest {
  messages: ChatMessage[];
  provider?: string;
  model?: string;
}

export interface CreateConversationRequest {
  title: string;
}

export interface SaveMessageRequest extends SaveMessageData {}

export interface UpdateConversationTitleRequest {
  title: string;
}

export interface BranchConversationRequest {
  upToTimestamp: number;
  newTitle: string;
}

// ============================================================================
// Controller Abstract Classes
// ============================================================================

export abstract class ChatController {
  abstract processMessage(req: Request, res: Response): Promise<void>;
  abstract generateTitle(req: Request, res: Response): Promise<void>;
}

export abstract class ConversationController {
  abstract createConversation(req: Request, res: Response): Promise<void>;
  abstract getConversation(req: Request, res: Response): Promise<void>;
  abstract listConversations(req: Request, res: Response): Promise<void>;
  abstract updateConversationTitle(req: Request, res: Response): Promise<void>;
  abstract deleteConversation(req: Request, res: Response): Promise<void>;
  abstract saveMessage(req: Request, res: Response): Promise<void>;
  abstract cleanupOldConversations(req: Request, res: Response): Promise<void>;
  abstract branchConversation(req: Request, res: Response): Promise<void>;
}

export abstract class ProviderController {
  abstract getProviders(req: Request, res: Response): void;
}

export abstract class SettingsController {
  abstract getApiKeys(req: Request, res: Response): Promise<void>;
  abstract setApiKey(req: Request, res: Response): Promise<void>;
  abstract deleteApiKey(req: Request, res: Response): Promise<void>;
}

export abstract class HealthController {
  abstract checkHealth(req: Request, res: Response): void;
}
