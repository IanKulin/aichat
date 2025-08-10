// scripts/sanity-check.ts

import "dotenv/config";
import { sendMessage, providerConfigs } from "../lib/ai-client.ts";
import type { SupportedProvider } from "../lib/types.ts";
import { logger } from "../lib/logger.ts";

async function runSanityCheck() {
  logger.info("Starting AI provider sanity check...");

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
      const response = await sendMessage(
        [{ role: "user", content: "hello" }],
        provider
      );
      logger.info(`[${provider}] Response: ${response}`);
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
