import { test, describe } from 'node:test'
import assert from 'node:assert'
import { DefaultHealthController } from '../../controllers/HealthController.ts'
import { container } from '../../lib/container.ts'
import type { ProviderService } from '../../services/ProviderService.ts'

describe('HealthController Tests', () => {
  let healthController: DefaultHealthController
  let mockProviderService: ProviderService

  const setupController = () => {
    // Create mock service
    mockProviderService = {
      validateAllProviders: () => ({
        openai: { valid: true, message: 'OpenAI API key configured' },
        anthropic: { valid: false, message: 'Anthropic API key not configured' },
        google: { valid: true, message: 'Google API key configured' },
        deepseek: { valid: false, message: 'DeepSeek API key not configured' },
        openrouter: { valid: false, message: 'OpenRouter API key not configured' }
      }),
      validateProvider: (provider: string) => provider === 'openai' || provider === 'google',
      getAvailableProviders: () => ['openai', 'google'],
      getProviderInfo: () => [],
      validateApiKey: (provider) => ({ valid: true, message: `${provider} configured` }),
      getProviderModel: () => ({ model: 'mock-model' })
    } as ProviderService

    // Create controller with mocked dependencies
    healthController = new DefaultHealthController(mockProviderService)
  }

  describe('checkHealth() method', () => {
    test('should return health status with API key validation', async () => {
      setupController()
      
      const mockRequest = {} as any

      const mockResponse = {
        json: (data: any) => {
          assert.ok(data)
          assert.strictEqual(data.status, 'ok')
          assert.ok(data.timestamp)
          assert.ok(data.providers)
          assert.ok(data.available_providers)
          assert.strictEqual(data.version, '1.0.0')
          
          // Check that all providers are included
          assert.ok('openai' in data.providers)
          assert.ok('anthropic' in data.providers)
          assert.ok('google' in data.providers)
          assert.ok('deepseek' in data.providers)
          assert.ok('openrouter' in data.providers)
          
          // Check validation results
          assert.strictEqual(data.providers.openai.valid, true)
          assert.strictEqual(data.providers.anthropic.valid, false)
          assert.strictEqual(data.providers.google.valid, true)
          assert.strictEqual(data.providers.deepseek.valid, false)
          assert.strictEqual(data.providers.openrouter.valid, false)
          
          // Check that messages are included
          assert.ok(data.providers.openai.message)
          assert.ok(data.providers.anthropic.message)
          
          // Check available providers
          assert.ok(Array.isArray(data.available_providers))
          assert.ok(data.available_providers.includes('openai'))
          assert.ok(data.available_providers.includes('google'))
          
          return mockResponse
        },
        status: () => mockResponse
      } as any

      healthController.checkHealth(mockRequest, mockResponse)
    })

    test('should handle all invalid API keys', async () => {
      setupController()
      
      // Override mock to return all invalid
      mockProviderService.validateAllProviders = () => ({
        openai: { valid: false, message: 'OpenAI API key not configured' },
        anthropic: { valid: false, message: 'Anthropic API key not configured' },
        google: { valid: false, message: 'Google API key not configured' },
        deepseek: { valid: false, message: 'DeepSeek API key not configured' },
        openrouter: { valid: false, message: 'OpenRouter API key not configured' }
      })

      const mockRequest = {} as any

      const mockResponse = {
        json: (data: any) => {
          assert.ok(data)
          assert.strictEqual(data.status, 'ok') // Health check still returns ok even if no keys
          
          // Check that all providers are invalid
          Object.values(data.providers).forEach((keyInfo: any) => {
            assert.strictEqual(keyInfo.valid, false)
            assert.ok(keyInfo.message.includes('not configured'))
          })
          
          return mockResponse
        },
        status: () => mockResponse
      } as any

      healthController.checkHealth(mockRequest, mockResponse)
    })

    test('should throw service errors', async () => {
      setupController()
      
      // Override mock to throw error
      mockProviderService.validateAllProviders = () => {
        throw new Error('Service error')
      }

      const mockRequest = {} as any
      const mockResponse = {} as any

      // HealthController doesn't handle errors - they bubble up
      assert.throws(() => {
        healthController.checkHealth(mockRequest, mockResponse)
      }, /Service error/)
    })

    test('should include valid timestamp format', async () => {
      setupController()
      
      const mockRequest = {} as any

      const mockResponse = {
        json: (data: any) => {
          assert.ok(data.timestamp)
          
          // Check that timestamp is a valid ISO string
          const timestamp = new Date(data.timestamp)
          assert.ok(!isNaN(timestamp.getTime()))
          
          // Check that timestamp is recent (within last 5 seconds)
          const now = new Date()
          const timeDiff = now.getTime() - timestamp.getTime()
          assert.ok(timeDiff >= 0 && timeDiff < 5000, 'Timestamp should be recent')
          
          return mockResponse
        },
        status: () => mockResponse
      } as any

      healthController.checkHealth(mockRequest, mockResponse)
    })
  })

  describe('Integration with DI Container', () => {
    test('should be resolvable from DI container', async () => {
      await import('../../lib/services.ts') // Initialize DI container
      const controller = container.resolve<DefaultHealthController>('HealthController')
      
      assert.ok(controller)
      assert.ok(typeof controller.checkHealth === 'function')
    })
  })
})