import { test, describe } from 'node:test'
import assert from 'node:assert'
import { providerConfigs } from '../lib/ai-client.ts'

describe('Configuration Tests', () => {
  describe('providerConfigs', () => {
    test('should have all required providers', () => {
      const expectedProviders = ['openai', 'google', 'anthropic', 'deepseek']
      const actualProviders = Object.keys(providerConfigs)
      
      expectedProviders.forEach(provider => {
        assert.ok(actualProviders.includes(provider), `Missing provider: ${provider}`)
      })
    })

    test('should have valid structure for each provider', () => {
      Object.entries(providerConfigs).forEach(([provider, config]) => {
        assert.ok(Array.isArray(config.models), `${provider} should have models array`)
        assert.ok(config.models.length > 0, `${provider} should have at least one model`)
        assert.ok(typeof config.defaultModel === 'string', `${provider} should have defaultModel string`)
        assert.ok(config.models.includes(config.defaultModel), `${provider} defaultModel should be in models array`)
      })
    })

    test('should have expected core models for OpenAI', () => {
      const openaiConfig = providerConfigs.openai
      
      // Test that core models are present (but allow for additional models)
      assert.ok(openaiConfig.models.some(model => model.includes('gpt')), 'OpenAI should have GPT models')
      assert.ok(openaiConfig.models.includes('gpt-4o-mini'), 'OpenAI should include gpt-4o-mini')
      assert.strictEqual(openaiConfig.defaultModel, 'gpt-4o-mini')
    })

    test('should have expected core models for Google', () => {
      const googleConfig = providerConfigs.google
      
      // Test that core models are present (but allow for additional models)
      assert.ok(googleConfig.models.some(model => model.includes('gemini')), 'Google should have Gemini models')
      assert.ok(googleConfig.models.includes('gemini-1.5-flash'), 'Google should include gemini-1.5-flash')
      assert.strictEqual(googleConfig.defaultModel, 'gemini-1.5-flash')
    })

    test('should have expected core models for Anthropic', () => {
      const anthropicConfig = providerConfigs.anthropic
      
      // Test that core models are present (but allow for additional models)
      assert.ok(anthropicConfig.models.some(model => model.includes('claude')), 'Anthropic should have Claude models')
      assert.ok(anthropicConfig.models.includes('claude-3-5-haiku-20241022'), 'Anthropic should include claude-3-5-haiku-20241022')
      assert.strictEqual(anthropicConfig.defaultModel, 'claude-3-5-haiku-20241022')
    })

    test('should have expected core models for DeepSeek', () => {
      const deepseekConfig = providerConfigs.deepseek
      
      // Test that core models are present (but allow for additional models)
      assert.ok(deepseekConfig.models.some(model => model.includes('deepseek')), 'DeepSeek should have DeepSeek models')
      assert.ok(deepseekConfig.models.includes('deepseek-chat'), 'DeepSeek should include deepseek-chat')
      assert.strictEqual(deepseekConfig.defaultModel, 'deepseek-chat')
    })

    test('should have no duplicate models within each provider', () => {
      Object.entries(providerConfigs).forEach(([provider, config]) => {
        const uniqueModels = [...new Set(config.models)]
        assert.strictEqual(config.models.length, uniqueModels.length, `${provider} has duplicate models`)
      })
    })

    test('should have non-empty model names', () => {
      Object.entries(providerConfigs).forEach(([provider, config]) => {
        config.models.forEach(model => {
          assert.ok(typeof model === 'string', `${provider} model should be string`)
          assert.ok(model.length > 0, `${provider} model should not be empty`)
        })
        assert.ok(config.defaultModel.length > 0, `${provider} defaultModel should not be empty`)
      })
    })
  })
})