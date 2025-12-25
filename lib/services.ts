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
  ConversationService,
  DefaultConversationService,
} from "../services/ConversationService.ts";
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
import { SettingsRepository } from "../repositories/SettingsRepository.ts";
import type { ISettingsRepository } from "../repositories/SettingsRepository.ts";
import {
  SettingsService,
  DefaultSettingsService,
} from "../services/SettingsService.ts";
import {
  SettingsController,
  DefaultSettingsController,
} from "../controllers/SettingsController.ts";

// Initialize services in the DI container
export function initializeServices(): void {
  // Register repositories first
  registerSingleton<ISettingsRepository>("SettingsRepository", () => {
    return new SettingsRepository();
  });

  registerSingleton<ModelRepository>("ModelRepository", () => {
    return new FileModelRepository();
  });

  registerSingleton<ProviderRepository>("ProviderRepository", () => {
    const settingsRepository =
      container.resolve<ISettingsRepository>("SettingsRepository");
    return new DefaultProviderRepository(settingsRepository);
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

  // Register ChatService (depends on ProviderService and ConfigService only)
  registerSingleton<ChatService>("ChatService", () => {
    const providerService =
      container.resolve<ProviderService>("ProviderService");
    const configService = container.resolve<ConfigService>("ConfigService");
    return new DefaultChatService(providerService, configService);
  });

  // Register ConversationService (depends on ChatRepository only)
  registerSingleton<ConversationService>("ConversationService", () => {
    const chatRepository = container.resolve<ChatRepository>("ChatRepository");
    return new DefaultConversationService(chatRepository);
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
    const conversationService = container.resolve<ConversationService>(
      "ConversationService"
    );
    return new DefaultConversationController(conversationService);
  });

  // Register SettingsService (depends on SettingsRepository, ProviderRepository, and ConfigService)
  registerSingleton<SettingsService>("SettingsService", () => {
    const settingsRepository =
      container.resolve<ISettingsRepository>("SettingsRepository");
    const providerRepository =
      container.resolve<ProviderRepository>("ProviderRepository");
    const configService = container.resolve<ConfigService>("ConfigService");
    return new DefaultSettingsService(
      settingsRepository,
      providerRepository,
      configService
    );
  });

  // Register SettingsController (depends on SettingsService)
  registerSingleton<SettingsController>("SettingsController", () => {
    const settingsService =
      container.resolve<SettingsService>("SettingsService");
    return new DefaultSettingsController(settingsService);
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

export function getConversationService(): ConversationService {
  return container.resolve<ConversationService>("ConversationService");
}

export function getSettingsRepository(): ISettingsRepository {
  return container.resolve<ISettingsRepository>("SettingsRepository");
}

export function getSettingsService(): SettingsService {
  return container.resolve<SettingsService>("SettingsService");
}

export function getSettingsController(): SettingsController {
  return container.resolve<SettingsController>("SettingsController");
}

// Initialize services when this module is imported
initializeServices();
