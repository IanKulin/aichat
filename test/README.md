# Test Suite Documentation

This directory contains unit tests for the AI Chat application using Node.js built-in test runner.

## Test Files

### `server.test.ts`
Tests the Express server API endpoints:
- **Chat API (`/api/chat`)**:
  - Validates request format (messages array required)
  - Validates message content (last message must have content)
- **Health Check API (`/api/health`)**:
  - Returns proper status information
  - Includes timestamp and version data

### `openai-client.test.ts`
Tests the OpenAI client functionality:
- **API Key Validation**:
  - Detects missing API keys
  - Validates API key format
  - Confirms valid keys
- **OpenAI Integration**:
  - Handles missing API key errors
  - Handles network connectivity issues
  - Handles API response errors
  - Parses successful responses

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch
```

## Test Features

- **No Production Code Changes**: Tests work with existing code without modifications
- **Proper Mocking**: Uses custom MockResponse class for API simulation
- **Environment Isolation**: Tests manage environment variables safely
- **TypeScript Support**: Full TypeScript integration with Node's experimental features
- **HTTP Testing**: Uses Supertest for Express endpoint testing

## Test Results
- ✅ 10 tests passing
- 4 test suites
- 0 failures
- Complete coverage of core functionality
