# AI Chat

**AI Chat** is a web interface to allow LLM chat using API keys from multiple providers (OpenAI, Anthropic, Google, DeepSeek, OpenRouter).

## Features

- Multi-provider AI chat with model selection
- SQLite-based conversation persistence
- Chat history management with conversation branching
- Markdown rendering with syntax highlighting
- Dark mode support
- Mobile-responsive design
- Rate limiting for protection against abuse

## Security
**AI Chat** is intended to be used on a local network in a self-hosted system, so it has minimal security and no authentication system.

Rate Limiting - The application implements tiered rate limiting per IP address to protect against request loops and resource exhaustion:
- Chat endpoints: 30 requests/minute
- API endpoints: 100 requests/minute
- Health check: 200 requests/minute

When limits are exceeded, the server returns a 429 status with a user-friendly error message.

## Installing with Docker

### Prerequisites
- Docker and Docker Compose installed
- `.env` file with at least one API key (see Environment Variables below)

### Quick Start

1. **Using Docker Compose** (recommended):
   ```bash
   docker-compose up -d
   ```
   Access the application at `http://localhost:3000`

2. **Using Docker directly**:
   ```bash
   docker run -d \
     --name aichat \
     -p 3000:3000 \
     -v ./data:/app/data \
     --env-file .env \
     ghcr.io/iankulin/aichat
   ```

### Environment Variables

Create a `.env` file with at least one of the following:
```
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
DEEPSEEK_API_KEY=your_key_here
OPENROUTER_API_KEY=your_key_here
PORT=3000  # Optional, defaults to 3000
```

### Data Persistence

The application stores data in the `./data` directory:
- `data/db/chat.db` - SQLite database for conversations
- `data/config/models.json` - Model configurations

This directory is automatically mounted when using Docker Compose.

## How to Add New Models:

Add a new model
  `npm run add-model add openai gpt-4o`

Add and set as default
  `npm run add-model add anthropic claude-3-opus-20240229 --default`

List all models
  `npm run add-model list`

List specific provider
  `npm run add-model list openai`

Change default
  `npm run add-model default google gemini-2.5-pro`