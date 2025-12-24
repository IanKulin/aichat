# CLAUDE.md

This file provides guidance to developers when working with code in this repository.

## Project Overview

This is a Node.js/Express web application that provides a chat interface for interacting with multiple AI providers (OpenAI, Anthropic, Google, DeepSeek, OpenRouter). It's a server-side rendered application with a single-page frontend that makes API calls to various AI services. The application includes SQLite-based chat persistence for conversation history management.

## Architecture

The application follows a layered architecture with dependency injection:

- **Backend**: Express.js server (`server.ts`) that handles API routes and serves static files
- **Frontend**: Single HTML file (`public/index.html`) with organized CSS (`public/css/`) and JavaScript assets (`public/js/`)
- **API Client**: AI SDK integration module (`lib/ai-client.ts`) that handles multi-provider API communication using Vercel AI SDK
- **Controllers**: Route handlers that orchestrate services (`controllers/`)
- **Services**: Business logic layer with dependency injection (`services/`)
- **Repositories**: Data access layer for configuration, provider management, and chat persistence (`repositories/`)
- **Middleware**: Cross-cutting concerns like error handling, validation, and logging (`middleware/`)
- **Dependency Injection**: Container for managing service lifecycles (`lib/container.ts`)
- **Database**: SQLite database for chat persistence (`data/db/chat.db`)
- **Configuration**: 
  - Environment variables managed via `.env` file and dotenv package
  - Model configurations stored in `data/config/models.json`

## Development Commands

- `npm install` - Install dependencies
- `npm start` - Start the server (node's strip-types mode for running ts natively)
- `npm run lint` - Lint TypeScript/JavaScript files
- `npm run format` - Prettier formatting
- `npm test` - Tests using Node built in test runner without using API tokens
- `npm run sanity-check` - calls each of the providers
- `npm run typecheck` - TypeScript type checking

## Environment Setup

Required environment variables (at least one must be set):
- `OPENAI_API_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `ANTHROPIC_API_KEY`
- `DEEPSEEK_API_KEY`
- `OPENROUTER_API_KEY`
- `PORT`: Optional, defaults to 3000

## API Endpoints

### Core Chat API
- `GET /`: Serves the main chat interface
- `POST /api/chat`: Handles chat messages (expects `{ messages: Array, provider?: string, model?: string }`)
- `GET /api/providers`: Returns available providers and their models
- `GET /api/health`: Health check endpoint with API key validation status

### Conversation Management API
- `POST /api/conversations`: Create a new conversation (expects `{ title: string }`)
- `GET /api/conversations`: List conversations with pagination (`?limit=50&offset=0`)
- `GET /api/conversations/:id`: Get conversation with messages by ID
- `PUT /api/conversations/:id/title`: Update conversation title (expects `{ title: string }`)
- `DELETE /api/conversations/:id`: Delete conversation and all its messages
- `POST /api/conversations/messages`: Save message to conversation
- `POST /api/conversations/:id/branch`: Create a branch from an existing conversation at a specific message

## Frontend Architecture

The frontend is a single HTML page with modular JavaScript architecture:
- **Modular JavaScript**: Code organized into separate modules (`app.js`, `api-client.js`, `chat.js`, `conversations.js`, `state.js`, `ui.js`)
- **Conversation history**: Stored both in memory and SQLite database with UI for managing old conversations
- **Provider and model selection**: Dropdowns with localStorage persistence
- **Dark mode support**: Via CSS media queries
- **Responsive design**: Mobile-friendly interface
- **Auto-resizing textarea**: For message input
- **Real-time message display**: Supports user/assistant/system message types with markdown rendering and syntax highlighting

## Code Structure

- `server.ts`: Main Express server with middleware and route registration
- `controllers/`: Route handlers that orchestrate services
- `services/`: Business logic with dependency injection
- `repositories/`: Data access layer for configuration and providers
- `middleware/`: Cross-cutting concerns (error handling, validation, logging, rate limiting)
- `lib/ai-client.ts`: AI SDK client with multi-provider support and API key validation
- `lib/container.ts`: Dependency injection container
- `lib/database.ts`: SQLite database connection and initialization
- `lib/logger.ts`: Simple logging wrapper using @iankulin/logger
- `public/index.html`: Complete frontend HTML file
- `public/css/`: Stylesheets including app styles and third-party CSS (Highlight.js themes)
- `public/js/`: JavaScript assets including:
  - `app.js`: Main application initialization and provider/model management
  - `api-client.js`: API communication layer
  - `chat.js`: Chat message handling and submission
  - `conversations.js`: Conversation management UI (list, load, delete, branch)
  - `state.js`: Application state management
  - `ui.js`: UI helper functions (message rendering, formatting)
  - `purify.min.js`, `highlight.min.js`: Third-party libraries
- `data/config/models.json`: Provider and model configuration
- `data/db/chat.db`: SQLite database for conversation persistence

## Middleware

### Rate Limiting

The application implements tiered rate limiting to protect against request loops, misbehaving clients, and resource exhaustion:

**Rate Limit Tiers:**
- **Chat endpoints** (`/api/chat`, `/api/generate-title`): 30 requests/minute per IP
- **API endpoints** (`/api/providers`, `/api/conversations/*`): 100 requests/minute per IP
- **Health check** (`/api/health`): 200 requests/minute per IP

**Implementation:**
- Located in `middleware/rate-limiter.ts`
- Uses `express-rate-limit` package with in-memory store
- Applied per-route in `server.ts` before request handlers

## Configuration Management

Model configurations are stored in `data/config/models.json` with the following structure:
```json
{
  "provider_id": {
    "name": "Display Name",
    "models": ["model1", "model2"],
    "defaultModel": "model1"
  }
}
```

## Docker Deployment

The application includes Docker support for easy deployment:

**Docker Image:**
- Available at `ghcr.io/iankulin/aichat`
- Exposes port 3000

**Docker Compose** (recommended):
   ```bash
   docker-compose up -d
   ```
**Volume Mounting:**
- Mount `./data` to `/app/data` to persist:
  - SQLite database (`chat.db`)
  - Model configurations (`models.json`)

## Security Considerations

- API key validation on startup with simplified format checking
- Error messages sanitized to prevent exposure of internal details
- **Rate limiting**: Tiered rate limits (30-200 req/min) per IP address to prevent abuse
- CORS not explicitly configured (defaults to same-origin)
- No authentication system - this is a basic application intended for self-hosting on local networks

## Tool use

- use the `temp` directory to store logs
- use the `temp` directory to write any disposable node or bash scripts you need
- assume a MacOS environment for CLI tools
- Playwright MCP is available for screenshots of the UI
- If you start a background process for testing, kill it before handing back to the user

## Code quality

At the conclusion of any change, run and fix:
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run format`
