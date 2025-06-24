import dotenv from "dotenv";
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { sendMessage, validateApiKey } from "./lib/openai-client.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

export const app = express();

// Type definitions
interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
}

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, "public")));

// Validate API key on startup
const apiKeyValidation = validateApiKey();
if (!apiKeyValidation.valid) {
  console.error("⚠️  API Key Issue:", apiKeyValidation.message);
  console.error("   Please set OPENAI_API_KEY environment variable");
  console.error("   Example: export OPENAI_API_KEY=sk-your-key-here");
} else {
  console.log("✅ OpenAI API key validated");
}

// Chat endpoint with OpenAI integration
app.post("/api/chat", async (req, res) => {
  try {
    const { messages }: ChatRequest = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || !lastMessage.content) {
      return res.status(400).json({ error: "Last message must have content" });
    }

    console.log("Received conversation with", messages.length, "messages");

    // Send full conversation to OpenAI
    const aiResponse = await sendMessage(messages);

    console.log("OpenAI response length:", aiResponse.length);

    res.json({
      response: aiResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in /api/chat:", (error as Error).message);

    // Don't expose internal error details to client
    let clientError =
      "Sorry, I'm having trouble processing your request right now.";

    if ((error as Error).message.includes("OPENAI_API_KEY")) {
      clientError = "Service configuration error. Please try again later.";
    } else if ((error as Error).message.includes("Network error")) {
      clientError =
        "Network error. Please check your connection and try again.";
    } else if ((error as Error).message.includes("OpenAI API error")) {
      clientError = "AI service is temporarily unavailable. Please try again.";
    }

    res.status(500).json({
      error: "Service Error",
      message: clientError,
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  const apiKeyStatus = validateApiKey();

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    openai_configured: apiKeyStatus.valid,
  });
});

// serve index.html for the default route
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    error: "Internal server error",
    message: "Something went wrong",
  });
  next();
});
