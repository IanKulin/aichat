// lib/services.ts - Service initialization and DI container setup

import { container, registerSingleton } from "./container.ts";
import {
  ConfigService,
  DefaultConfigService,
} from "../services/ConfigService.ts";
import {
  ProviderService,
  DefaultProviderService,
} from "../services/ProviderService.ts";
import { ChatService, DefaultChatService } from "../services/ChatService.ts";
import {
  ModelRepository,
  FileModelRepository,
} from "../repositories/ModelRepository.ts";
import {
  ProviderRepository,
  DefaultProviderRepository,
} from "../repositories/ProviderRepository.ts";
import { ChatRepository } from "../repositories/ChatRepository.ts";
import { SqliteChatRepository } from "../repositories/SqliteChatRepository.ts";
import {
  ChatController,
  DefaultChatController,
} from "../controllers/ChatController.ts";
import {
  ProviderController,
  DefaultProviderController,
} from "../controllers/ProviderController.ts";
import {
  HealthController,
  DefaultHealthController,
} from "../controllers/HealthController.ts";
import {
  ConversationController,
  DefaultConversationController,
} from "../controllers/ConversationController.ts";

// Initialize services in the DI container
export function initializeServices(): void {
  // Register repositories first
  registerSingleton<ModelRepository>("ModelRepository", () => {
    return new FileModelRepository();
  });

  registerSingleton<ProviderRepository>("ProviderRepository", () => {
    return new DefaultProviderRepository();
  });

  registerSingleton<ChatRepository>("ChatRepository", () => {
    return new SqliteChatRepository();
  });

  // Register ConfigService (depends on ModelRepository)
  registerSingleton<ConfigService>("ConfigService", () => {
    const modelRepository =
      container.resolve<ModelRepository>("ModelRepository");
    return new DefaultConfigService(modelRepository);
  });

  // Register ProviderService (depends on ConfigService and ProviderRepository)
  registerSingleton<ProviderService>("ProviderService", () => {
    const configService = container.resolve<ConfigService>("ConfigService");
    const providerRepository =
      container.resolve<ProviderRepository>("ProviderRepository");
    return new DefaultProviderService(configService, providerRepository);
  });

  // Register ChatService (depends on ProviderService, ConfigService, and ChatRepository)
  registerSingleton<ChatService>("ChatService", () => {
    const providerService =
      container.resolve<ProviderService>("ProviderService");
    const configService = container.resolve<ConfigService>("ConfigService");
    const chatRepository = container.resolve<ChatRepository>("ChatRepository");
    return new DefaultChatService(
      providerService,
      configService,
      chatRepository
    );
  });

  // Register Controllers
  registerSingleton<ChatController>("ChatController", () => {
    const chatService = container.resolve<ChatService>("ChatService");
    const providerService =
      container.resolve<ProviderService>("ProviderService");
    const configService = container.resolve<ConfigService>("ConfigService");
    return new DefaultChatController(
      chatService,
      providerService,
      configService
    );
  });

  registerSingleton<ProviderController>("ProviderController", () => {
    const providerService =
      container.resolve<ProviderService>("ProviderService");
    return new DefaultProviderController(providerService);
  });

  registerSingleton<HealthController>("HealthController", () => {
    const providerService =
      container.resolve<ProviderService>("ProviderService");
    return new DefaultHealthController(providerService);
  });

  registerSingleton<ConversationController>("ConversationController", () => {
    const chatService = container.resolve<ChatService>("ChatService");
    return new DefaultConversationController(chatService);
  });
}

// Helper functions to resolve services
export function getConfigService(): ConfigService {
  return container.resolve<ConfigService>("ConfigService");
}

export function getProviderService(): ProviderService {
  return container.resolve<ProviderService>("ProviderService");
}

export function getChatService(): ChatService {
  return container.resolve<ChatService>("ChatService");
}

export function getChatController(): ChatController {
  return container.resolve<ChatController>("ChatController");
}

export function getProviderController(): ProviderController {
  return container.resolve<ProviderController>("ProviderController");
}

export function getHealthController(): HealthController {
  return container.resolve<HealthController>("HealthController");
}

export function getChatRepository(): ChatRepository {
  return container.resolve<ChatRepository>("ChatRepository");
}

export function getConversationController(): ConversationController {
  return container.resolve<ConversationController>("ConversationController");
}

// Initialize services when this module is imported
initializeServices();
