// lib/openai-client.ts

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface OpenAIRequestBody {
  model: string;
  messages: ChatMessage[];
  max_tokens: number;
  temperature: number;
}

interface OpenAIChoice {
  message: {
    content: string;
  };
}

interface OpenAIResponse {
  choices: OpenAIChoice[];
}

interface OpenAIError {
  error?: {
    message?: string;
  };
}

interface ApiKeyValidation {
  valid: boolean;
  message: string;
}

export async function sendMessage(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  const requestBody: OpenAIRequestBody = {
    model: "gpt-3.5-turbo",
    messages: messages,
    max_tokens: 1000,
    temperature: 0.7,
  };

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData: OpenAIError = await response.json().catch(() => ({}));
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ""}`
      );
    }

    const data: OpenAIResponse = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Unexpected response format from OpenAI API");
    }

    return data.choices[0].message.content.trim();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("Network error: Unable to connect to OpenAI API");
    }
    throw error;
  }
}

// Optional: Helper function to validate API key format
export function validateApiKey(): ApiKeyValidation {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      valid: false,
      message: "OPENAI_API_KEY not found in environment variables",
    };
  }

  if (!apiKey.startsWith("sk-")) {
    return { valid: false, message: 'OPENAI_API_KEY should start with "sk-"' };
  }

  if (apiKey.length < 20) {
    return { valid: false, message: "OPENAI_API_KEY appears to be too short" };
  }

  return { valid: true, message: "API key format looks valid" };
}
