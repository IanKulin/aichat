# CLAUDE.md

This file provides guidance to developers when working with code in this repository.

## Project Overview

This is a Node.js/Express web application that provides a chat interface for interacting with multiple AI providers (OpenAI, Anthropic, Google, DeepSeek, OpenRouter). It's a server-side rendered application with a single-page frontend that makes API calls to various AI services.

## Architecture

The application follows a layered architecture with dependency injection:

- **Backend**: Express.js server (`server.ts`) that handles API routes and serves static files
- **Frontend**: Single HTML file (`public/index.html`) with organized CSS (`public/css/`) and JavaScript assets (`public/js/`)
- **API Client**: AI SDK integration module (`lib/ai-client.ts`) that handles multi-provider API communication using Vercel AI SDK
- **Controllers**: Route handlers that orchestrate services (`controllers/`)
- **Services**: Business logic layer with dependency injection (`services/`)
- **Repositories**: Data access layer for configuration and provider management (`repositories/`)
- **Middleware**: Cross-cutting concerns like error handling, validation, and logging (`middleware/`)
- **Dependency Injection**: Container for managing service lifecycles (`lib/container.ts`)
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

- `GET /`: Serves the main chat interface
- `POST /api/chat`: Handles chat messages (expects `{ messages: Array, provider?: string, model?: string }`)
- `GET /api/providers`: Returns available providers and their models
- `GET /api/health`: Health check endpoint with API key validation status

## Frontend Architecture

The frontend is a single html page with:
- Conversation history stored in memory (`conversationHistory` array)
- Provider and model selection dropdowns with localStorage persistence
- Dark mode support via CSS media queries
- Responsive design for mobile devices
- Auto-resizing textarea for message input
- Real-time message display with user/assistant/system message types

## Key Features

- Full conversation context is maintained and sent to providers
- Uses the Vercel AI SDK to abstract calls to multiple providers
- Dynamic provider/model selection with user preference persistence
- Simplified error handling and API key validation
- Layered architecture with dependency injection for better maintainability

## Code Structure

- `server.ts`: Main Express server with middleware and route registration
- `controllers/`: Route handlers that orchestrate services
- `services/`: Business logic with dependency injection
- `repositories/`: Data access layer for configuration and providers
- `middleware/`: Cross-cutting concerns (error handling, validation, logging)
- `lib/ai-client.ts`: AI SDK client with multi-provider support and API key validation
- `lib/container.ts`: Dependency injection container
- `lib/logger.ts`: Simple logging wrapper using @iankulin/logger
- `public/index.html`: Complete frontend HTML file
- `public/css/`: Stylesheets including app styles and third-party CSS (Highlight.js themes)
- `public/js/`: JavaScript assets including third-party libraries (DOMPurify, Highlight.js)
- `data/config/models.json`: Provider and model configuration

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

## Security Considerations

- API key validation on startup with simplified format checking
- Error messages sanitized to prevent exposure of internal details
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
