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
  getConversationService,
  getSettingsController,
} from "./lib/services.ts";
import { errorHandler, asyncHandler } from "./middleware/errorHandler.ts";
import {
  validateChatRequest,
  validateJsonBody,
} from "./middleware/validation.ts";
import { requestLogger, chatLogger } from "./middleware/logging.ts";
import {
  chatLimiter,
  apiLimiter,
  healthLimiter,
} from "./middleware/rate-limiter.ts";
import { closeDatabase } from "./lib/database.ts";

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
const settingsController = getSettingsController();

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

// Startup cleanup for old conversations
const enableStartupCleanup = process.env.ENABLE_STARTUP_CLEANUP !== "false";
const retentionDays = parseInt(process.env.CHAT_RETENTION_DAYS || "90", 10);

if (enableStartupCleanup) {
  const conversationService = getConversationService();
  setImmediate(async () => {
    try {
      const deletedCount =
        await conversationService.cleanupOldConversations(retentionDays);
      if (deletedCount > 0) {
        logger.info(
          `Startup cleanup: Deleted ${deletedCount} conversations older than ${retentionDays} days`
        );
      }
    } catch (error) {
      logger.error("Startup cleanup failed:", error);
    }
  });
}

// Chat endpoint with multi-provider support
app.post(
  "/api/chat",
  chatLimiter,
  validateChatRequest,
  asyncHandler(async (req, res) => {
    await chatController.processMessage(req, res);
  })
);

// Title generation endpoint
app.post(
  "/api/generate-title",
  chatLimiter,
  asyncHandler(async (req, res) => {
    await chatController.generateTitle(req, res);
  })
);

// Providers endpoint - returns available providers and their models
app.get("/api/providers", apiLimiter, (req, res) => {
  providerController.getProviders(req, res);
});

// Health check endpoint
app.get("/api/health", healthLimiter, (req, res) => {
  healthController.checkHealth(req, res);
});

// Conversation management endpoints
app.post(
  "/api/conversations",
  apiLimiter,
  asyncHandler(async (req, res) => {
    await conversationController.createConversation(req, res);
  })
);

app.get(
  "/api/conversations",
  apiLimiter,
  asyncHandler(async (req, res) => {
    await conversationController.listConversations(req, res);
  })
);

app.get(
  "/api/conversations/:id",
  apiLimiter,
  asyncHandler(async (req, res) => {
    await conversationController.getConversation(req, res);
  })
);

app.put(
  "/api/conversations/:id/title",
  apiLimiter,
  asyncHandler(async (req, res) => {
    await conversationController.updateConversationTitle(req, res);
  })
);

app.delete(
  "/api/conversations/:id",
  apiLimiter,
  asyncHandler(async (req, res) => {
    await conversationController.deleteConversation(req, res);
  })
);

app.post(
  "/api/conversations/:id/branch",
  apiLimiter,
  asyncHandler(async (req, res) => {
    await conversationController.branchConversation(req, res);
  })
);

app.post(
  "/api/conversations/messages",
  apiLimiter,
  asyncHandler(async (req, res) => {
    await conversationController.saveMessage(req, res);
  })
);

app.post(
  "/api/conversations/cleanup",
  apiLimiter,
  asyncHandler(async (req, res) => {
    await conversationController.cleanupOldConversations(req, res);
  })
);

// Settings endpoints
app.get(
  "/api/settings/keys",
  apiLimiter,
  asyncHandler(async (req, res) => {
    await settingsController.getApiKeys(req, res);
  })
);

app.post(
  "/api/settings/keys",
  apiLimiter,
  asyncHandler(async (req, res) => {
    await settingsController.setApiKey(req, res);
  })
);

app.delete(
  "/api/settings/keys/:provider",
  apiLimiter,
  asyncHandler(async (req, res) => {
    await settingsController.deleteApiKey(req, res);
  })
);

// Serve settings page
app.get("/settings.html", (req, res) => {
  res.sendFile(join(__dirname, "public", "settings.html"));
});

// Error handling middleware
app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`API available at http://localhost:${PORT}/api/chat`);
  logger.info(`Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown handling
let isShuttingDown = false;

function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    logger.warn(`${signal} received again, forcing exit`);
    process.exit(1);
  }

  isShuttingDown = true;
  logger.info(`${signal} received, starting graceful shutdown...`);

  // Force shutdown after 10 seconds
  const forceShutdownTimer = setTimeout(() => {
    logger.error("Graceful shutdown timed out, forcing exit");
    process.exit(1);
  }, 10000);

  server.close((err) => {
    if (err) {
      logger.error("Error during server shutdown:", err);
      process.exit(1);
    }

    logger.info("Server closed, cleaning up database...");
    closeDatabase();
    clearTimeout(forceShutdownTimer);
    logger.info("Shutdown complete");
    process.exit(0);
  });
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
