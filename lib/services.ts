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

// Initialize services in the DI container
export function initializeServices(): void {
  // Register repositories first
  registerSingleton<ModelRepository>("ModelRepository", () => {
    return new FileModelRepository();
  });

  registerSingleton<ProviderRepository>("ProviderRepository", () => {
    return new DefaultProviderRepository();
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

  // Register ChatService (depends on ProviderService and ConfigService)
  registerSingleton<ChatService>("ChatService", () => {
    const providerService =
      container.resolve<ProviderService>("ProviderService");
    const configService = container.resolve<ConfigService>("ConfigService");
    return new DefaultChatService(providerService, configService);
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

// Initialize services when this module is imported
initializeServices();
