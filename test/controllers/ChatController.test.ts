import { test, describe } from 'node:test'
import assert from 'node:assert'
import { DefaultChatController } from '../../controllers/ChatController.ts'
import { container } from '../../lib/container.ts'
import type { ChatService } from '../../services/ChatService.ts'
import type { ProviderService } from '../../services/ProviderService.ts'
import type { ConfigService } from '../../services/ConfigService.ts'

describe('ChatController Tests', () => {
  let chatController: DefaultChatController
  let mockChatService: ChatService
  let mockProviderService: ProviderService
  let mockConfigService: ConfigService

  const setupController = () => {
    // Create mock services
    mockChatService = {
      processMessage: async (messages, provider, model) => ({
        content: 'Mock response',
        finishReason: 'stop',
        usage: { inputTokens: 10, outputTokens: 20 }
      }),
      streamMessage: async (messages, provider, model) => ({
        textStream: async function* () { yield 'Mock'; yield ' stream' },
        finishReason: 'stop'
      })
    } as ChatService

    mockProviderService = {
      validateProvider: (provider: string) => provider === 'openai' || provider === 'anthropic',
      getAvailableProviders: () => ['openai', 'anthropic'],
      getProviderInfo: () => [
        { id: 'openai', name: 'OpenAI', models: ['gpt-4o-mini'] },
        { id: 'anthropic', name: 'Anthropic', models: ['claude-3-5-haiku-20241022'] }
      ],
      validateApiKey: (provider) => ({ valid: true, message: `${provider} configured` }),
      validateAllProviders: () => ({ openai: { valid: true, message: 'OK' } }),
      getProviderModel: () => ({ model: 'mock-model' })
    } as ProviderService

    mockConfigService = {
      getProviderConfigs: () => ({}),
      getProviderConfig: (provider) => {
        if (provider === 'invalid-provider') {
          throw new Error(`Configuration not found for provider: ${provider}`)
        }
        return {
          name: 'Mock Provider',
          models: ['mock-model'],
          defaultModel: 'mock-model'
        }
      },
      validateConfiguration: () => {}
    } as ConfigService

    // Create controller with mocked dependencies
    chatController = new DefaultChatController(mockChatService, mockProviderService, mockConfigService)
  }

  describe('processMessage() method', () => {
    test('should process chat message successfully', async () => {
      setupController()
      
      const mockRequest = {
        body: {
          messages: [{ role: 'user', content: 'Hello' }],
          provider: 'openai',
          model: 'gpt-4o-mini'
        }
      } as any

      const mockResponse = {
        json: (data: any) => {
          assert.ok(data)
          assert.strictEqual(data.content, 'Mock response')
          assert.strictEqual(data.finishReason, 'stop')
          assert.ok(data.usage)
          return mockResponse
        },
        status: (code: number) => {
          assert.strictEqual(code, 200)
          return mockResponse
        }
      } as any

      await chatController.processMessage(mockRequest, mockResponse)
    })

    test('should process request without validation', async () => {
      setupController()
      
      const mockRequest = {
        body: {
          provider: 'openai'
          // No messages - controller doesn't validate, relies on middleware
        }
      } as any

      const mockResponse = {
        json: (data: any) => {
          // Controller will process whatever is passed
          assert.ok(data)
          return mockResponse
        },
        status: () => mockResponse
      } as any

      await chatController.processMessage(mockRequest, mockResponse)
    })

    test('should throw error for invalid provider', async () => {
      setupController()
      
      const mockRequest = {
        body: {
          messages: [{ role: 'user', content: 'Hello' }],
          provider: 'invalid-provider'
        }
      } as any

      const mockResponse = {
        json: () => mockResponse,
        status: () => mockResponse
      } as any

      // Controller will throw error when trying to get config for invalid provider
      try {
        await chatController.processMessage(mockRequest, mockResponse)
        assert.fail('Should have thrown an error')
      } catch (error) {
        assert.ok(error instanceof Error)
        assert.ok(error.message.includes('Configuration not found'))
      }
    })

    test('should use default provider when none specified', async () => {
      setupController()
      
      const mockRequest = {
        body: {
          messages: [{ role: 'user', content: 'Hello' }]
        }
      } as any

      const mockResponse = {
        json: (data: any) => {
          assert.ok(data)
          assert.strictEqual(data.content, 'Mock response')
          return mockResponse
        },
        status: () => mockResponse
      } as any

      await chatController.processMessage(mockRequest, mockResponse)
    })

    test('should throw service errors', async () => {
      setupController()
      
      // Override mock to throw error
      mockChatService.processMessage = async () => {
        throw new Error('Service error')
      }

      const mockRequest = {
        body: {
          messages: [{ role: 'user', content: 'Hello' }],
          provider: 'openai'
        }
      } as any

      const mockResponse = {
        json: () => mockResponse,
        status: () => mockResponse
      } as any

      // Controller doesn't handle errors - they bubble up
      try {
        await chatController.processMessage(mockRequest, mockResponse)
        assert.fail('Should have thrown an error')
      } catch (error) {
        assert.ok(error instanceof Error)
        assert.strictEqual(error.message, 'Service error')
      }
    })
  })

  describe('Integration with DI Container', () => {
    test('should be resolvable from DI container', async () => {
      await import('../../lib/services.ts') // Initialize DI container
      const controller = container.resolve<DefaultChatController>('ChatController')
      
      assert.ok(controller)
      assert.ok(typeof controller.processMessage === 'function')
    })
  })
})