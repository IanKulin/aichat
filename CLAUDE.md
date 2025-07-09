# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Node.js/Express web application that provides a chat interface for interacting with multiple AI providers (OpenAI, Anthropic, Google, DeepSeek). It's a server-side rendered application with a single-page frontend that makes API calls to various AI services.

## Architecture

- **Backend**: Express.js server (`server.ts`) that handles API routes and serves static files
- **Frontend**: Single HTML file (`public/index.html`) with embedded CSS and JavaScript
- **API Client**: AI SDK integration module (`lib/ai-client.ts`) that handles multi-provider API communication using Vercel AI SDK
- **Configuration**: Environment variables managed via `.env` file and dotenv package

## Development Commands

- `npm install` - Install dependencies
- `npm start` - Start the server (node's strip-types mode for running ts natively)
- `npm run lint` - Lint TypeScript/JavaScript files
- `npm run format` - Prettier formatting

## Environment Setup

Required environment variables:
- `OPENAI_API_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `ANTHROPIC_API_KEY`
- `DEEPSEEK_API_KEY`
- `PORT`: Optional, defaults to 3000

## API Endpoints

- `GET /`: Serves the main chat interface
- `POST /api/chat`: Handles chat messages (expects `{ messages: Array }`)
- `GET /api/health`: Health check endpoint with API key validation status

## Frontend Architecture

The frontend is a single-page application with:
- Conversation history stored in memory (`conversationHistory` array)
- Dark mode support via CSS media queries
- Responsive design for mobile devices
- Auto-resizing textarea for message input
- Real-time message display with user/assistant/system message types

## Key Features

- Full conversation context is maintained and sent to providers
- Uses the Vercel AI SDK to abstract calls to multiple providers

## Code Structure

- `server.ts`: Main Express server with middleware, routes, and error handling
- `lib/ai-client.ts`: AI SDK client with multi-provider support and API key validation
- `public/index.html`: Complete frontend with HTML, CSS, and JavaScript

## Security Considerations

- API key validation on startup
- Error messages sanitized to prevent exposure of internal details
- CORS not explicitly configured (defaults to same-origin)
- No authentication system - this is a basic demo application

## Tool use

- use the `temp` directory to store logs
- use the `temp` directory to write any disposable node or bash scripts you need
- assume a MacOS environment for CLI tools
- Playwright MCP is available for screenshots of the UI