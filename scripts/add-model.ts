#!/usr/bin/env node

// Script to add new models to the configuration
import fs from "fs";
import path from "path";

interface ModelConfig {
  name: string;
  models: string[];
  defaultModel: string;
}

interface AllConfigs {
  [provider: string]: ModelConfig;
}

function loadCurrentConfig(): AllConfigs {
  try {
    const configPath = path.join(
      process.cwd(),
      "data",
      "config",
      "models.json"
    );
    const configData = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(configData);
  } catch (error) {
    console.error(
      "❌ Failed to load current config:",
      error instanceof Error ? error.message : "Unknown error"
    );
    process.exit(1);
  }
}

function saveConfig(config: AllConfigs): void {
  try {
    const configPath = path.join(
      process.cwd(),
      "data",
      "config",
      "models.json"
    );
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
    console.log("✅ Configuration updated successfully");
  } catch (error) {
    console.error(
      "❌ Failed to save config:",
      error instanceof Error ? error.message : "Unknown error"
    );
    process.exit(1);
  }
}

function addModel(
  provider: string,
  model: string,
  setAsDefault: boolean = false
): void {
  const config = loadCurrentConfig();

  if (!config[provider]) {
    console.error(
      `❌ Provider '${provider}' not found. Available providers: ${Object.keys(config).join(", ")}`
    );
    process.exit(1);
  }

  // Check if model already exists
  if (config[provider].models.includes(model)) {
    console.log(`ℹ️  Model '${model}' already exists for ${provider}`);
    return;
  }

  // Add the model
  config[provider].models.push(model);

  // Set as default if requested
  if (setAsDefault) {
    config[provider].defaultModel = model;
    console.log(`📝 Added '${model}' to ${provider} and set as default`);
  } else {
    console.log(`📝 Added '${model}' to ${provider}`);
  }

  saveConfig(config);
}

function listModels(provider?: string): void {
  const config = loadCurrentConfig();

  if (provider) {
    if (!config[provider]) {
      console.error(`❌ Provider '${provider}' not found`);
      process.exit(1);
    }

    console.log(`\n📋 Models for ${config[provider].name}:`);
    config[provider].models.forEach((model, index) => {
      const isDefault =
        model === config[provider].defaultModel ? " (default)" : "";
      console.log(`  ${index + 1}. ${model}${isDefault}`);
    });
  } else {
    console.log("\n📋 All configured models:");
    Object.values(config).forEach((providerConfig) => {
      console.log(`\n${providerConfig.name}:`);
      providerConfig.models.forEach((model, index) => {
        const isDefault =
          model === providerConfig.defaultModel ? " (default)" : "";
        console.log(`  ${index + 1}. ${model}${isDefault}`);
      });
    });
  }
}

function setDefaultModel(provider: string, model: string): void {
  const config = loadCurrentConfig();

  if (!config[provider]) {
    console.error(`❌ Provider '${provider}' not found`);
    process.exit(1);
  }

  if (!config[provider].models.includes(model)) {
    console.error(
      `❌ Model '${model}' not found for ${provider}. Available: ${config[provider].models.join(", ")}`
    );
    process.exit(1);
  }

  config[provider].defaultModel = model;
  console.log(`✅ Set '${model}' as default for ${provider}`);
  saveConfig(config);
}

function showHelp(): void {
  console.log(`
🤖 AI Model Configuration Helper

Usage:
  npm run add-model <command> [options]

Commands:
  add <provider> <model>     Add a new model to a provider
  add <provider> <model> --default    Add model and set as default
  list [provider]            List all models or models for specific provider
  default <provider> <model> Set default model for provider
  help                       Show this help message

Examples:
  npm run add-model add openai gpt-4o
  npm run add-model add anthropic claude-3-opus-20240229 --default
  npm run add-model list
  npm run add-model list openai
  npm run add-model default google gemini-2.5-pro

Available providers: openai, anthropic, google, deepseek
`);
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "help") {
  showHelp();
  process.exit(0);
}

const command = args[0];

switch (command) {
  case "add":
    if (args.length < 3) {
      console.error("❌ Usage: add <provider> <model> [--default]");
      process.exit(1);
    }
    const provider = args[1];
    const model = args[2];
    const setAsDefault = args.includes("--default");
    addModel(provider, model, setAsDefault);
    break;

  case "list":
    const listProvider = args[1];
    listModels(listProvider);
    break;

  case "default":
    if (args.length < 3) {
      console.error("❌ Usage: default <provider> <model>");
      process.exit(1);
    }
    setDefaultModel(args[1], args[2]);
    break;

  default:
    console.error(`❌ Unknown command: ${command}`);
    showHelp();
    process.exit(1);
}
