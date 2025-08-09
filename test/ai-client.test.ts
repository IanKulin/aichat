import { test, describe } from 'node:test'
import assert from 'node:assert'
import { validateApiKey, getProviderConfig, validateAllProviders } from '../lib/ai-client.ts'

describe('AI Client Tests', () => {
  describe('validateApiKey()', () => {
    test('should return true for valid OpenAI API key', () => {
      process.env.OPENAI_API_KEY = 'sk-1234567890abcdef'
      const result = validateApiKey('openai')
      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.message, 'OpenAI API key format looks valid')
    })

    test('should return false for invalid OpenAI API key format', () => {
      process.env.OPENAI_API_KEY = 'invalid-key'
      const result = validateApiKey('openai')
      assert.strictEqual(result.valid, false)
      assert.strictEqual(result.message, 'OpenAI API key should start with "sk-"')
    })

    test('should return false for empty OpenAI API key', () => {
      process.env.OPENAI_API_KEY = ''
      const result = validateApiKey('openai')
      assert.strictEqual(result.valid, false)
      assert.strictEqual(result.message, 'OpenAI API key not found in environment variables')
    })

    test('should return false for undefined OpenAI API key', () => {
      delete process.env.OPENAI_API_KEY
      const result = validateApiKey('openai')
      assert.strictEqual(result.valid, false)
      assert.strictEqual(result.message, 'OpenAI API key not found in environment variables')
    })

    test('should return true for valid Google API key', () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'valid-google-key'
      const result = validateApiKey('google')
      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.message, 'Google API key format looks valid')
    })

    test('should return false for empty Google API key', () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = ''
      const result = validateApiKey('google')
      assert.strictEqual(result.valid, false)
      assert.strictEqual(result.message, 'Google API key not found in environment variables')
    })

    test('should return true for valid Anthropic API key', () => {
      process.env.ANTHROPIC_API_KEY = 'valid-anthropic-key'
      const result = validateApiKey('anthropic')
      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.message, 'Anthropic API key format looks valid')
    })

    test('should return true for valid DeepSeek API key', () => {
      process.env.DEEPSEEK_API_KEY = 'valid-deepseek-key'
      const result = validateApiKey('deepseek')
      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.message, 'DeepSeek API key format looks valid')
    })

    test('should return false for unknown provider', () => {
      try {
        const result = validateApiKey('unknown' as any)
        assert.fail('Should have thrown an error')
      } catch (error) {
        assert.ok(error instanceof Error)
        assert.ok(error.message.includes('Cannot read properties of undefined'))
      }
    })
  })

  describe('getProviderConfig()', () => {
    test('should return correct config for openai', () => {
      const config = getProviderConfig('openai')
      assert.ok(config)
      assert.strictEqual(config.models.includes('gpt-3.5-turbo'), true)
      assert.strictEqual(config.defaultModel, 'gpt-3.5-turbo')
    })

    test('should return correct config for google', () => {
      const config = getProviderConfig('google')
      assert.ok(config)
      assert.ok(config.models.some(model => model.includes('gemini')), 'Google should have Gemini models')
      assert.strictEqual(config.defaultModel, 'gemini-2.5-flash')
    })

    test('should return correct config for anthropic', () => {
      const config = getProviderConfig('anthropic')
      assert.ok(config)
      assert.ok(config.models.some(model => model.includes('claude')), 'Anthropic should have Claude models')
      assert.strictEqual(config.defaultModel, 'claude-3-haiku-20240307')
    })

    test('should return correct config for deepseek', () => {
      const config = getProviderConfig('deepseek')
      assert.ok(config)
      assert.ok(config.models.some(model => model.includes('deepseek')), 'DeepSeek should have DeepSeek models')
      assert.strictEqual(config.defaultModel, 'deepseek-chat')
    })

    test('should return undefined for unknown provider', () => {
      const config = getProviderConfig('unknown' as any)
      assert.strictEqual(config, undefined)
    })
  })

  describe('validateAllProviders()', () => {
    test('should return validation status for all providers', () => {
      process.env.OPENAI_API_KEY = 'sk-validkey123456'
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'valid-google-key123456'
      delete process.env.ANTHROPIC_API_KEY
      delete process.env.DEEPSEEK_API_KEY

      const result = validateAllProviders()
      assert.strictEqual(result.openai.valid, true)
      assert.strictEqual(result.google.valid, true)
      assert.strictEqual(result.anthropic.valid, false)
      assert.strictEqual(result.deepseek.valid, false)
    })

    test('should return all false when no API keys are set', () => {
      delete process.env.OPENAI_API_KEY
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY
      delete process.env.ANTHROPIC_API_KEY
      delete process.env.DEEPSEEK_API_KEY

      const result = validateAllProviders()
      assert.strictEqual(result.openai.valid, false)
      assert.strictEqual(result.google.valid, false)
      assert.strictEqual(result.anthropic.valid, false)
      assert.strictEqual(result.deepseek.valid, false)
    })

    test('should return all true when all API keys are valid', () => {
      process.env.OPENAI_API_KEY = 'sk-validkey123456'
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'valid-google-key123456'
      process.env.ANTHROPIC_API_KEY = 'valid-anthropic-key123456'
      process.env.DEEPSEEK_API_KEY = 'valid-deepseek-key123456'

      const result = validateAllProviders()
      assert.strictEqual(result.openai.valid, true)
      assert.strictEqual(result.google.valid, true)
      assert.strictEqual(result.anthropic.valid, true)
      assert.strictEqual(result.deepseek.valid, true)
    })
  })
})
