import dotenv from "dotenv";
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { logger } from "./lib/logger.ts";
import {
  sendMessage,
  validateAllProviders,
  getProviderConfig,
  providerConfigs,
  type SupportedProvider,
} from "./lib/ai-client.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 3000;

// Type definitions
interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  provider?: string;
  model?: string;
}

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, "public")));

// Validate API keys on startup
const providerValidations = validateAllProviders();
const availableProviders = Object.keys(providerConfigs) as SupportedProvider[];

Object.entries(providerValidations).forEach(([provider, validation]) => {
  if (!validation.valid) {
    logger.warn(`${provider}: ${validation.message}`);
  }
});

if (availableProviders.length === 0) {
  logger.warn(" No valid API keys found");
  logger.warn(
    "   Please set at least one of: OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, DEEPSEEK_API_KEY"
  );
  logger.warn("   Example: export OPENAI_API_KEY=sk-your-key-here");
} else {
  logger.info(`Valid providers: ${availableProviders.join(", ")}`);
}

// Chat endpoint with multi-provider support
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, provider, model }: ChatRequest = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || !lastMessage.content) {
      return res.status(400).json({ error: "Last message must have content" });
    }

    // Validate provider if specified
    const selectedProvider = provider || "openai";
    if (!availableProviders.includes(selectedProvider as SupportedProvider)) {
      return res.status(400).json({
        error: "Invalid provider",
        message: `Provider '${selectedProvider}' is not available. Available providers: ${availableProviders.join(", ")}`,
      });
    }

    logger.debug(
      `Received conversation with ${messages.length} messages for provider: ${selectedProvider}`
    );

    // Get the actual model that will be used
    const providerConfig = getProviderConfig(
      selectedProvider as SupportedProvider
    );
    const actualModel = model || providerConfig.defaultModel;

    // Send full conversation to selected provider
    const aiResponse = await sendMessage(
      messages,
      selectedProvider as SupportedProvider,
      actualModel
    );

    logger.debug(
      `${selectedProvider} (${actualModel}) response length:`,
      aiResponse.length
    );

    res.json({
      response: aiResponse,
      timestamp: new Date().toISOString(),
      provider: selectedProvider,
      providerName: providerConfig.name,
      model: actualModel,
    });
  } catch (error) {
    logger.error("Error in /api/chat:", (error as Error).message);

    // Don't expose internal error details to client
    let clientError =
      "Sorry, I'm having trouble processing your request right now.";

    if ((error as Error).message.includes("API key")) {
      clientError = "Service configuration error. Please try again later.";
    } else if ((error as Error).message.includes("Network error")) {
      clientError =
        "Network error. Please check your connection and try again.";
    } else if ((error as Error).message.includes("API error")) {
      clientError = "AI service is temporarily unavailable. Please try again.";
    } else if ((error as Error).message.includes("Model error")) {
      clientError =
        "Selected model is not available. Please try a different model.";
    }

    res.status(500).json({
      error: "Service Error",
      message: clientError,
    });
  }
});

// Providers endpoint - returns available providers and their models
app.get("/api/providers", (req, res) => {
  const providersData = availableProviders.map((provider) => ({
    id: provider,
    name: providerConfigs[provider].name,
    models: providerConfigs[provider].models,
    defaultModel: providerConfigs[provider].defaultModel,
  }));

  res.json({
    providers: providersData,
    default: availableProviders.length > 0 ? availableProviders[0] : null,
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  const providerValidations = validateAllProviders();
  const availableProviders = Object.keys(
    providerConfigs
  ) as SupportedProvider[];

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    providers: providerValidations,
    available_providers: availableProviders,
  });
});

// serve index.html for the default route
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error("Unhandled error:", error);
  res.status(500).json({
    error: "Internal server error",
    message: "Something went wrong",
  });
  next();
});

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`API available at http://localhost:${PORT}/api/chat`);
  logger.info(`Health check: http://localhost:${PORT}/api/health`);
});
