// scripts/sanity-check.ts

import "dotenv/config";
import {
  getConfigService,
  getChatService,
} from "../lib/services.ts";
import type { SupportedProvider } from "../lib/types.ts";
import { logger } from "../lib/logger.ts";

async function runSanityCheck() {
  logger.info("Starting AI provider sanity check...");

  const configService = getConfigService();
  const chatService = getChatService();
  const providerConfigs = configService.getProviderConfigs();
  
  const availableProviders = Object.keys(
    providerConfigs
  ) as SupportedProvider[];

  if (availableProviders.length === 0) {
    logger.warn(
      "No available providers with valid API keys. Skipping sanity check."
    );
    return;
  }

  logger.info(`Found available providers: ${availableProviders.join(", ")}`);

  for (const provider of availableProviders) {
    try {
      logger.info(`\n--- Checking ${provider} ---`);
      const result = await chatService.processMessage(
        [{ role: "user", content: "hello" }],
        provider
      );
      logger.info(`[${provider}] Response: ${result.response}`);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`[${provider}] Error: ${error.message}`);
      } else {
        logger.error(`[${provider}] An unknown error occurred.`);
      }
    }
  }

  logger.info("\nSanity check complete.");
}

runSanityCheck();
