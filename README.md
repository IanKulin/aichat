# AI Chat 
- **AI Chat** is a web interface to allow LLM chat using API keys. 



## Security
**AI Chat** is intended to be used on a local network in a self-hosted system, so it has minimal security and no authentication system.

Rate Limiting - The application implements tiered rate limiting per IP address to protect against request loops and resource exhaustion:
- Chat endpoints: 30 requests/minute
- API endpoints: 100 requests/minute
- Health check: 200 requests/minute

When limits are exceeded, the server returns a 429 status with a user-friendly error message.

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