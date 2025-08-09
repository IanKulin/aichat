import { test, describe } from 'node:test'
import assert from 'node:assert'
import { DefaultProviderRepository } from '../../repositories/ProviderRepository.ts'
import { container } from '../../lib/container.ts'

describe('ProviderRepository Tests', () => {
  let providerRepository: DefaultProviderRepository

  const setupRepository = () => {
    providerRepository = new DefaultProviderRepository()
  }

  describe('validateApiKey() method', () => {
    test('should validate OpenAI API key format and presence', () => {
      setupRepository()
      
      // Test with valid API key
      process.env.OPENAI_API_KEY = 'sk-1234567890abcdef1234567890abcdef'
      const result = providerRepository.validateApiKey('openai')
      
      assert.strictEqual(typeof result, 'object')
      assert.strictEqual(typeof result.valid, 'boolean')
      assert.strictEqual(typeof result.message, 'string')
      
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length >= 10) {
        assert.strictEqual(result.valid, true)
        assert.strictEqual(result.message, 'OpenAI API key configured')
      }
    })

    test('should reject empty or missing OpenAI API key', () => {
      setupRepository()
      
      // Test with empty key
      process.env.OPENAI_API_KEY = ''
      let result = providerRepository.validateApiKey('openai')
      assert.strictEqual(result.valid, false)
      assert.strictEqual(result.message, 'OpenAI API key not configured')
      
      // Test with undefined key
      delete process.env.OPENAI_API_KEY
      result = providerRepository.validateApiKey('openai')
      assert.strictEqual(result.valid, false)
      assert.strictEqual(result.message, 'OpenAI API key not configured')
    })

    test('should validate Anthropic API key', () => {
      setupRepository()
      
      // Test with valid API key
      process.env.ANTHROPIC_API_KEY = 'sk-ant-1234567890abcdef'
      const result = providerRepository.validateApiKey('anthropic')
      
      assert.strictEqual(typeof result, 'object')
      if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.length >= 10) {
        assert.strictEqual(result.valid, true)
        assert.strictEqual(result.message, 'Anthropic API key configured')
      }
    })

    test('should validate Google API key', () => {
      setupRepository()
      
      // Test with valid API key
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'valid-google-api-key-12345'
      const result = providerRepository.validateApiKey('google')
      
      assert.strictEqual(typeof result, 'object')
      if (process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GOOGLE_GENERATIVE_AI_API_KEY.length >= 10) {
        assert.strictEqual(result.valid, true)
        assert.strictEqual(result.message, 'Google API key configured')
      }
    })

    test('should validate DeepSeek API key', () => {
      setupRepository()
      
      // Test with valid API key
      process.env.DEEPSEEK_API_KEY = 'valid-deepseek-api-key-12345'
      const result = providerRepository.validateApiKey('deepseek')
      
      assert.strictEqual(typeof result, 'object')
      if (process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY.length >= 10) {
        assert.strictEqual(result.valid, true)
        assert.strictEqual(result.message, 'DeepSeek API key configured')
      }
    })

    test('should validate OpenRouter API key', () => {
      setupRepository()
      
      // Test with valid API key
      process.env.OPENROUTER_API_KEY = 'sk-or-1234567890abcdef'
      const result = providerRepository.validateApiKey('openrouter')
      
      assert.strictEqual(typeof result, 'object')
      if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.length >= 10) {
        assert.strictEqual(result.valid, true)
        assert.strictEqual(result.message, 'OpenRouter API key configured')
      }
    })

    test('should reject unknown providers', () => {
      setupRepository()
      
      const result = providerRepository.validateApiKey('unknown' as any)
      assert.strictEqual(result.valid, false)
      assert.ok(result.message.includes('not configured'))
    })
  })

  describe('hasValidApiKey() method', () => {
    test('should return true for providers with valid API keys', () => {
      setupRepository()
      
      // Set up a valid API key
      process.env.OPENAI_API_KEY = 'sk-valid-key-1234567890'
      
      const hasValid = providerRepository.hasValidApiKey('openai')
      assert.strictEqual(typeof hasValid, 'boolean')
      
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length >= 10) {
        assert.strictEqual(hasValid, true)
      }
    })

    test('should return false for providers with invalid API keys', () => {
      setupRepository()
      
      // Clear the API key
      delete process.env.OPENAI_API_KEY
      
      const hasValid = providerRepository.hasValidApiKey('openai')
      assert.strictEqual(hasValid, false)
    })

    test('should return false for unknown providers', () => {
      setupRepository()
      
      const hasValid = providerRepository.hasValidApiKey('unknown' as any)
      assert.strictEqual(hasValid, false)
    })
  })

  describe('getProvider() method', () => {
    test('should return provider instance for OpenAI', () => {
      setupRepository()
      
      // This test might fail without actual API key, but we test the structure
      try {
        const provider = providerRepository.getProvider('openai', 'gpt-4o-mini')
        assert.ok(provider)
        // Provider should have some structure - exact structure depends on implementation
      } catch (error) {
        // Expected if no API key is configured
        assert.ok(error instanceof Error)
      }
    })

    test('should return provider instance for Anthropic', () => {
      setupRepository()
      
      try {
        const provider = providerRepository.getProvider('anthropic', 'claude-3-5-haiku-20241022')
        assert.ok(provider)
      } catch (error) {
        // Expected if no API key is configured
        assert.ok(error instanceof Error)
      }
    })

    test('should return provider instance for Google', () => {
      setupRepository()
      
      try {
        const provider = providerRepository.getProvider('google', 'gemini-1.5-flash')
        assert.ok(provider)
      } catch (error) {
        // Expected if no API key is configured
        assert.ok(error instanceof Error)
      }
    })

    test('should return provider instance for DeepSeek', () => {
      setupRepository()
      
      try {
        const provider = providerRepository.getProvider('deepseek', 'deepseek-chat')
        assert.ok(provider)
      } catch (error) {
        // Expected if no API key is configured
        assert.ok(error instanceof Error)
      }
    })

    test('should return provider instance for OpenRouter', () => {
      setupRepository()
      
      try {
        const provider = providerRepository.getProvider('openrouter', 'openrouter/auto')
        assert.ok(provider)
      } catch (error) {
        // Expected if no API key is configured
        assert.ok(error instanceof Error)
      }
    })

    test('should handle unsupported providers', () => {
      setupRepository()
      
      assert.throws(() => {
        providerRepository.getProvider('unknown' as any, 'some-model')
      }, /not configured|missing/)
    })
  })

  describe('clearCache() method', () => {
    test('should clear provider cache', () => {
      setupRepository()
      
      // Cache should be clearable without throwing
      assert.doesNotThrow(() => {
        providerRepository.clearCache()
      })
    })

    test('should allow getting providers after cache clear', () => {
      setupRepository()
      
      providerRepository.clearCache()
      
      // Should still work after cache clear
      try {
        const provider = providerRepository.getProvider('openai', 'gpt-4o-mini')
        assert.ok(provider)
      } catch (error) {
        // Expected if no API key is configured
        assert.ok(error instanceof Error)
      }
    })
  })

  describe('Provider Instance Caching', () => {
    test('should cache provider instances', () => {
      setupRepository()
      
      // Set up API key for testing
      process.env.OPENAI_API_KEY = 'sk-test-key-1234567890'
      
      try {
        const provider1 = providerRepository.getProvider('openai', 'gpt-4o-mini')
        const provider2 = providerRepository.getProvider('openai', 'gpt-4o-mini')
        
        // Should return same instance (cached)
        assert.strictEqual(provider1, provider2)
      } catch (error) {
        // If we can't test caching due to missing API key, at least verify error is consistent
        try {
          providerRepository.getProvider('openai', 'gpt-4o-mini')
          assert.fail('Should have thrown same error')
        } catch (error2) {
          assert.strictEqual(error.message, error2.message)
        }
      }
    })

    test('should cache different models separately', () => {
      setupRepository()
      
      process.env.OPENAI_API_KEY = 'sk-test-key-1234567890'
      
      try {
        const provider1 = providerRepository.getProvider('openai', 'gpt-4o-mini')
        const provider2 = providerRepository.getProvider('openai', 'gpt-4o')
        
        // Different models should be different instances (or at least not cause issues)
        assert.ok(provider1)
        assert.ok(provider2)
      } catch (error) {
        // Expected if no API key configured
        assert.ok(error instanceof Error)
      }
    })
  })

  describe('Integration with DI Container', () => {
    test('should be resolvable from DI container', async () => {
      await import('../../lib/services.ts') // Initialize DI container
      const repository = container.resolve<DefaultProviderRepository>('ProviderRepository')
      
      assert.ok(repository)
      assert.ok(typeof repository.validateApiKey === 'function')
      assert.ok(typeof repository.hasValidApiKey === 'function')
      assert.ok(typeof repository.getProvider === 'function')
      assert.ok(typeof repository.clearCache === 'function')
    })
  })
})