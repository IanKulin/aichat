#!/usr/bin/env node

import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

interface ModelConfig {
  [provider: string]: {
    name: string;
    models: string[];
    defaultModel: string;
  };
}

interface ValidationResult {
  provider: string;
  valid: string[];
  invalid: string[];
  unavailable: string[];
  error?: string;
}

interface ProviderModel {
  id: string;
  name?: string;
  supportedGenerationMethods?: string[];
}

interface ProviderResponse {
  data?: ProviderModel[];
  models?: ProviderModel[];
}

// Provider API endpoints and handlers
const providers = {
  openai: {
    endpoint: "https://api.openai.com/v1/models",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    getModels: (data: ProviderResponse) =>
      data.data?.map((model: ProviderModel) => model.id) || [],
  },
  anthropic: {
    endpoint: "https://api.anthropic.com/v1/models",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    getModels: (data: ProviderResponse) =>
      data.data?.map((model: ProviderModel) => model.id) || [],
  },
  google: {
    endpoint: `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`,
    headers: {},
    getModels: (data: ProviderResponse) => {
      return (
        data.models
          ?.filter((model: ProviderModel) =>
            model.supportedGenerationMethods?.includes("generateContent")
          )
          .map(
            (model: ProviderModel) =>
              model.name?.replace("models/", "") || model.id
          ) || []
      );
    },
  },
  deepseek: {
    endpoint: "https://api.deepseek.com/v1/models",
    headers: {
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json",
    },
    getModels: (data: ProviderResponse) =>
      data.data?.map((model: ProviderModel) => model.id) || [],
  },
  openrouter: {
    endpoint: "https://openrouter.ai/api/v1/models",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    getModels: (data: ProviderResponse) =>
      data.data?.map((model: ProviderModel) => model.id) || [],
  },
};

async function fetchProviderModels(provider: string): Promise<string[]> {
  const config = providers[provider as keyof typeof providers];
  if (!config) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  const response = await fetch(config.endpoint, {
    method: "GET",
    headers: config.headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return config.getModels(data);
}

async function validateProvider(
  provider: string,
  configuredModels: string[]
): Promise<ValidationResult> {
  try {
    const availableModels = await fetchProviderModels(provider);

    if (availableModels.length === 0) {
      console.log(`\n${provider.toUpperCase()}:`);
      console.log(`   Error: No models returned from API`);
      return {
        provider,
        valid: [],
        invalid: [],
        unavailable: configuredModels,
        error: "No models returned from API",
      };
    }

    const valid = configuredModels.filter((model) =>
      availableModels.includes(model)
    );
    const invalid = configuredModels.filter(
      (model) => !availableModels.includes(model)
    );

    console.log(`\n${provider.toUpperCase()}:`);
    console.log(`   Available (${availableModels.length})`);
    if (valid.length > 0) {
      console.log(`   Valid (${valid.length}): ${valid.join(", ")}`);
    }
    if (invalid.length > 0) {
      console.log(`   Invalid (${invalid.length}): ${invalid.join(", ")}`);
    }

    return {
      provider,
      valid,
      invalid,
      unavailable: [],
    };
  } catch (error) {
    console.log(`\n${provider.toUpperCase()}:`);
    console.log(
      `   Error: ${error instanceof Error ? error.message : String(error)}`
    );
    return {
      provider,
      valid: [],
      invalid: [],
      unavailable: configuredModels,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  console.log("Model Validation Starting...\n");

  // Check if models.json exists
  const configPath = path.join(process.cwd(), "data", "config", "models.json");
  if (!fs.existsSync(configPath)) {
    console.error("ERROR: models.json not found at:", configPath);
    process.exit(1);
  }

  // Load configuration
  let config: ModelConfig;
  try {
    const configContent = fs.readFileSync(configPath, "utf-8");
    config = JSON.parse(configContent);
  } catch (error) {
    console.error("ERROR: Error reading models.json:", error);
    process.exit(1);
  }

  // Check environment variables
  const missingKeys = [];
  if (!process.env.OPENAI_API_KEY) missingKeys.push("OPENAI_API_KEY");
  if (!process.env.ANTHROPIC_API_KEY) missingKeys.push("ANTHROPIC_API_KEY");
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY)
    missingKeys.push("GOOGLE_GENERATIVE_AI_API_KEY");
  if (!process.env.DEEPSEEK_API_KEY) missingKeys.push("DEEPSEEK_API_KEY");
  if (!process.env.OPENROUTER_API_KEY) missingKeys.push("OPENROUTER_API_KEY");

  if (missingKeys.length > 0) {
    console.warn("WARNING: Missing API keys:", missingKeys.join(", "));
    console.warn("   Some providers will be skipped\n");
  }

  // Validate each provider
  const results: ValidationResult[] = [];

  for (const [provider, providerConfig] of Object.entries(config)) {
    if (missingKeys.some((key) => key.toLowerCase().includes(provider))) {
      console.log(`\n${provider.toUpperCase()}: Skipping (missing API key)`);
      continue;
    }

    const result = await validateProvider(provider, providerConfig.models);
    results.push(result);
  }

  // Final result and cleanup
  let totalValid = 0;
  let totalInvalid = 0;
  let hasErrors = false;
  let configModified = false;

  for (const result of results) {
    totalValid += result.valid.length;
    totalInvalid += result.invalid.length;
    if (result.error) {
      hasErrors = true;
    }

    // Remove invalid models from config
    if (result.invalid.length > 0) {
      config[result.provider].models = result.valid;
      configModified = true;
    }
  }

  console.log(`\nTOTALS: ${totalValid} valid, ${totalInvalid} invalid models`);

  // Save updated config if any models were removed
  if (configModified) {
    try {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
      console.log("UPDATED: Removed invalid models from models.json");
    } catch (error) {
      console.error("ERROR: Failed to update models.json:", error);
      process.exit(1);
    }
  }

  if (totalInvalid > 0) {
    console.log("FIXED: Invalid models have been removed");
    process.exit(0);
  } else if (hasErrors) {
    console.log("FAILED: Model validation failed due to API errors");
    process.exit(1);
  } else {
    console.log("SUCCESS: All configured models are valid");
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("FATAL ERROR:", error);
  process.exit(1);
});
