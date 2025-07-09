// scripts/sanity-check.ts

import "dotenv/config";
import { sendMessage, getAvailableProviders } from "../lib/ai-client.ts";

async function runSanityCheck() {
  console.log("Starting AI provider sanity check...");

  const availableProviders = getAvailableProviders();

  if (availableProviders.length === 0) {
    console.log(
      "No available providers with valid API keys. Skipping sanity check."
    );
    return;
  }

  console.log(`Found available providers: ${availableProviders.join(", ")}`);

  for (const provider of availableProviders) {
    try {
      console.log(`\n--- Checking ${provider} ---`);
      const response = await sendMessage(
        [{ role: "user", content: "hello" }],
        provider
      );
      console.log(`[${provider}] Response: ${response}`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`[${provider}] Error: ${error.message}`);
      } else {
        console.error(`[${provider}] An unknown error occurred.`);
      }
    }
  }

  console.log("\nSanity check complete.");
}

runSanityCheck();
