# AI Chat 
- Web interface to allow LLM chat using API keys

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