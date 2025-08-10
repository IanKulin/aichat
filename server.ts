import dotenv from "dotenv";
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { logger } from "./lib/logger.ts";
import {
  getProviderService,
  getChatController,
  getProviderController,
  getHealthController,
  getConversationController,
} from "./lib/services.ts";
import { errorHandler, asyncHandler } from "./middleware/errorHandler.ts";
import {
  validateChatRequest,
  validateJsonBody,
} from "./middleware/validation.ts";
import { requestLogger, chatLogger } from "./middleware/logging.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, "public")));
app.use(validateJsonBody);
app.use(requestLogger);
app.use(chatLogger);

// Initialize controllers and services
const providerService = getProviderService();
const chatController = getChatController();
const providerController = getProviderController();
const healthController = getHealthController();
const conversationController = getConversationController();

// Validate API keys on startup
const providerValidations = providerService.validateAllProviders();
const availableProviders = providerService.getAvailableProviders();

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
app.post(
  "/api/chat",
  validateChatRequest,
  asyncHandler(async (req, res) => {
    await chatController.processMessage(req, res);
  })
);

// Title generation endpoint
app.post(
  "/api/generate-title",
  asyncHandler(async (req, res) => {
    await chatController.generateTitle(req, res);
  })
);

// Providers endpoint - returns available providers and their models
app.get("/api/providers", (req, res) => {
  providerController.getProviders(req, res);
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  healthController.checkHealth(req, res);
});

// Conversation management endpoints
app.post(
  "/api/conversations",
  asyncHandler(async (req, res) => {
    await conversationController.createConversation(req, res);
  })
);

app.get(
  "/api/conversations",
  asyncHandler(async (req, res) => {
    await conversationController.listConversations(req, res);
  })
);

app.get(
  "/api/conversations/:id",
  asyncHandler(async (req, res) => {
    await conversationController.getConversation(req, res);
  })
);

app.put(
  "/api/conversations/:id/title",
  asyncHandler(async (req, res) => {
    await conversationController.updateConversationTitle(req, res);
  })
);

app.delete(
  "/api/conversations/:id",
  asyncHandler(async (req, res) => {
    await conversationController.deleteConversation(req, res);
  })
);

app.post(
  "/api/conversations/messages",
  asyncHandler(async (req, res) => {
    await conversationController.saveMessage(req, res);
  })
);

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`API available at http://localhost:${PORT}/api/chat`);
  logger.info(`Health check: http://localhost:${PORT}/api/health`);
});
