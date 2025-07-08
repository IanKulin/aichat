# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Node.js/Express web application that provides a chat interface for interacting with OpenAI's GPT models. It's a server-side rendered application with a single-page frontend that makes API calls to OpenAI.

## Architecture

- **Backend**: Express.js server (`server.js`) that handles API routes and serves static files
- **Frontend**: Single HTML file (`public/index.html`) with embedded CSS and JavaScript
- **API Client**: OpenAI integration module (`lib/openai-client.js`) that handles API communication
- **Configuration**: Environment variables managed via `.env` file and dotenv package

## Development Commands

```bash
# Install dependencies
npm install

# Start the server (node's strip-types mode for running ts natively)
npm start

# Lint JavaScript files
npm run lint

# Format JavaScript files
npm run format
```

The server runs on port 3000 by default (configurable via PORT environment variable).

## Environment Setup

Required environment variables:
- `OPENAI_API_KEY`: Your OpenAI API key (must start with 'sk-')
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

- Full conversation context is maintained and sent to OpenAI
- Error handling with user-friendly messages
- Dark mode support (automatic based on system preference)
- API key validation on startup
- Responsive design for mobile and desktop

## Code Structure

- `server.js`: Main Express server with middleware, routes, and error handling
- `lib/openai-client.js`: OpenAI API client with message sending and API key validation
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