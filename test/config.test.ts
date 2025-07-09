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

    test('should have expected models for OpenAI', () => {
      const openaiConfig = providerConfigs.openai
      const expectedModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo']
      
      expectedModels.forEach(model => {
        assert.ok(openaiConfig.models.includes(model), `OpenAI missing model: ${model}`)
      })
      assert.strictEqual(openaiConfig.defaultModel, 'gpt-3.5-turbo')
    })

    test('should have expected models for Google', () => {
      const googleConfig = providerConfigs.google
      const expectedModels = ['gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-pro']
      
      expectedModels.forEach(model => {
        assert.ok(googleConfig.models.includes(model), `Google missing model: ${model}`)
      })
      assert.strictEqual(googleConfig.defaultModel, 'gemini-2.0-flash-exp')
    })

    test('should have expected models for Anthropic', () => {
      const anthropicConfig = providerConfigs.anthropic
      const expectedModels = ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229']
      
      expectedModels.forEach(model => {
        assert.ok(anthropicConfig.models.includes(model), `Anthropic missing model: ${model}`)
      })
      assert.strictEqual(anthropicConfig.defaultModel, 'claude-3-haiku-20240307')
    })

    test('should have expected models for DeepSeek', () => {
      const deepseekConfig = providerConfigs.deepseek
      const expectedModels = ['deepseek-chat', 'deepseek-coder']
      
      expectedModels.forEach(model => {
        assert.ok(deepseekConfig.models.includes(model), `DeepSeek missing model: ${model}`)
      })
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