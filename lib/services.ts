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

// Initialize services in the DI container
export function initializeServices(): void {
  // Register ConfigService
  registerSingleton<ConfigService>("ConfigService", () => {
    return new DefaultConfigService();
  });

  // Register ProviderService (depends on ConfigService)
  registerSingleton<ProviderService>("ProviderService", () => {
    const configService = container.resolve<ConfigService>("ConfigService");
    return new DefaultProviderService(configService);
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
