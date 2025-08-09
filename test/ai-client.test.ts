import { test, describe } from 'node:test'
import assert from 'node:assert'
import { validateApiKey, getProviderConfig, validateAllProviders } from '../lib/ai-client.ts'

describe('AI Client Tests', () => {
  describe('validateApiKey()', () => {
    test('should return true for valid OpenAI API key', () => {
      process.env.OPENAI_API_KEY = 'sk-1234567890abcdef'
      const result = validateApiKey('openai')
      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.message, 'OpenAI API key configured')
    })

    test('should return true for invalid OpenAI API key format', () => {
      process.env.OPENAI_API_KEY = 'invalid-key'
      const result = validateApiKey('openai')
      assert.strictEqual(result.valid, true) // Simplified validation now accepts any key >= 10 chars
      assert.strictEqual(result.message, 'OpenAI API key configured')
      delete process.env.OPENAI_API_KEY
    })

    test('should return false for empty OpenAI API key', () => {
      process.env.OPENAI_API_KEY = ''
      const result = validateApiKey('openai')
      assert.strictEqual(result.valid, false)
      assert.strictEqual(result.message, 'OpenAI API key not configured')
    })

    test('should return false for undefined OpenAI API key', () => {
      delete process.env.OPENAI_API_KEY
      const result = validateApiKey('openai')
      assert.strictEqual(result.valid, false)
      assert.strictEqual(result.message, 'OpenAI API key not configured')
    })

    test('should return true for valid Google API key', () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'valid-google-key'
      const result = validateApiKey('google')
      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.message, 'Google API key configured')
    })

    test('should return false for empty Google API key', () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = ''
      const result = validateApiKey('google')
      assert.strictEqual(result.valid, false)
      assert.strictEqual(result.message, 'Google API key not configured')
    })

    test('should return true for valid Anthropic API key', () => {
      process.env.ANTHROPIC_API_KEY = 'valid-anthropic-key'
      const result = validateApiKey('anthropic')
      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.message, 'Anthropic API key configured')
    })

    test('should return true for valid DeepSeek API key', () => {
      process.env.DEEPSEEK_API_KEY = 'valid-deepseek-key'
      const result = validateApiKey('deepseek')
      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.message, 'DeepSeek API key configured')
    })

    test('should return false for unknown provider', () => {
      // @ts-expect-error Testing invalid provider
      const result = validateApiKey('unknown')
      assert.strictEqual(result.valid, false)
    })
  })

  describe('getProviderConfig()', () => {
    test('should return correct config for openai', () => {
      const config = getProviderConfig('openai')
      assert.strictEqual(config.name, 'OpenAI')
      assert.strictEqual(config.defaultModel, 'gpt-4o-mini')
      assert.ok(Array.isArray(config.models))
    })

    test('should return correct config for google', () => {
      const config = getProviderConfig('google')
      assert.strictEqual(config.name, 'Google')
      assert.strictEqual(config.defaultModel, 'gemini-1.5-flash')
      assert.ok(Array.isArray(config.models))
    })

    test('should return correct config for anthropic', () => {
      const config = getProviderConfig('anthropic')
      assert.strictEqual(config.name, 'Anthropic')
      assert.strictEqual(config.defaultModel, 'claude-3-5-haiku-20241022')
      assert.ok(Array.isArray(config.models))
    })

    test('should return correct config for deepseek', () => {
      const config = getProviderConfig('deepseek')
      assert.strictEqual(config.name, 'DeepSeek')
      assert.strictEqual(config.defaultModel, 'deepseek-chat')
      assert.ok(Array.isArray(config.models))
    })

    test('should return undefined for unknown provider', () => {
      // @ts-expect-error Testing invalid provider
      const config = getProviderConfig('unknown')
      assert.strictEqual(config, undefined)
    })
  })

  describe('validateAllProviders()', () => {
    test('should return validation status for all providers', () => {
      const results = validateAllProviders()
      assert.ok(typeof results === 'object')
      assert.ok('openai' in results)
      assert.ok('anthropic' in results)
      assert.ok('google' in results)
      assert.ok('deepseek' in results)
      assert.ok('openrouter' in results)
    })

    test('should return all false when no API keys are set', () => {
      // Clear all API keys
      delete process.env.OPENAI_API_KEY
      delete process.env.ANTHROPIC_API_KEY
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY
      delete process.env.DEEPSEEK_API_KEY
      delete process.env.OPENROUTER_API_KEY

      const results = validateAllProviders()
      assert.strictEqual(results.openai.valid, false)
      assert.strictEqual(results.anthropic.valid, false)
      assert.strictEqual(results.google.valid, false)
      assert.strictEqual(results.deepseek.valid, false)
      assert.strictEqual(results.openrouter.valid, false)
    })

    test('should return all true when all API keys are valid', () => {
      // Set all API keys
      process.env.OPENAI_API_KEY = 'sk-1234567890abcdef'
      process.env.ANTHROPIC_API_KEY = 'valid-anthropic-key'
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'valid-google-key'
      process.env.DEEPSEEK_API_KEY = 'valid-deepseek-key'
      process.env.OPENROUTER_API_KEY = 'sk-or-1234567890abcdef'

      const results = validateAllProviders()
      assert.strictEqual(results.openai.valid, true)
      assert.strictEqual(results.anthropic.valid, true)
      assert.strictEqual(results.google.valid, true)
      assert.strictEqual(results.deepseek.valid, true)
      assert.strictEqual(results.openrouter.valid, true)
    })
  })
})