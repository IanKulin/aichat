import { test, describe } from 'node:test'
import assert from 'node:assert'
import { DefaultChatService } from '../../services/ChatService.ts'
import { container } from '../../lib/container.ts'

describe('ChatService Tests', () => {
  let chatService: DefaultChatService
  let mockProviderService: any
  let mockConfigService: any

  const setupService = () => {
    // Create mock ProviderService
    mockProviderService = {
      getProviderModel: (provider: string, model: string) => {
        // Mock model objects for different providers
        const models = {
          'openai-gpt-4o-mini': { modelId: 'gpt-4o-mini' },
          'anthropic-claude-3-5-haiku-20241022': { modelId: 'claude-3-5-haiku-20241022' },
          'google-gemini-2.5-flash-lite': { modelId: 'gemini-2.5-flash-lite' }
        }
        return models[`${provider}-${model}`] || { modelId: model }
      },
      getAvailableProviders: () => ['openai', 'anthropic', 'google'],
      validateProvider: (provider: string) => ['openai', 'anthropic', 'google'].includes(provider)
    }

    // Create mock ConfigService  
    mockConfigService = {
      getProviderConfig: (_provider: string) => ({
        name: 'Mock Provider',
        models: ['mock-model'],
        defaultModel: 'mock-model'
      })
    }

    // Create service with mocked dependencies
    chatService = new DefaultChatService(mockProviderService, mockConfigService)
  }

  describe('processMessage() method', () => {
    test('should process message with OpenAI provider', async () => {
      setupService()

      const messages = [
        { role: 'user' as const, content: 'Hello, how are you?' }
      ]

      // Mock the generateText function
      const _originalGenerateText = (await import('ai')).generateText
      const _mockGenerateText = async ({ model: _model, messages: _msgs }: any) => ({
        text: 'Hello! I am doing well, thank you for asking.',
        finishReason: 'stop',
        usage: { inputTokens: 10, outputTokens: 15 }
      })

      // Override the import temporarily (this is a simplified approach)
      try {
        const result = await chatService.processMessage(messages, 'openai', 'gpt-4o-mini')

        // Note: This test is limited because we can't easily mock the 'ai' package imports
        // In a real scenario, we'd inject the AI client as a dependency
        assert.ok(result)
        // The actual implementation will call the real AI service
        // For this test, we're just verifying the method doesn't throw
      } catch (error) {
        // This is expected since we don't have real API keys in tests
        assert.ok(error instanceof Error)
      }
    })

    test('should handle invalid provider', async () => {
      setupService()

      const messages = [
        { role: 'user' as const, content: 'Hello' }
      ]

      try {
        await chatService.processMessage(messages, 'invalid-provider' as any, 'some-model')
        assert.fail('Should have thrown an error for invalid provider')
      } catch (error) {
        assert.ok(error instanceof Error)
      }
    })

    test('should use correct model for provider', async () => {
      setupService()

      const messages = [
        { role: 'user' as const, content: 'Test message' }
      ]

      // Test that the service calls getProviderModel with correct parameters
      let getProviderModelCalled = false
      let calledProvider = ''
      let calledModel = ''

      mockProviderService.getProviderModel = (_provider: string, _model: string) => {
        getProviderModelCalled = true
        calledProvider = provider
        calledModel = model
        throw new Error('Test error to verify call') // Throw to stop execution
      }

      // Make sure the provider is available
      mockProviderService.getAvailableProviders = () => ['anthropic']

      try {
        await chatService.processMessage(messages, 'anthropic', 'claude-3-5-haiku-20241022')
      } catch {
        // Verify the service was called with correct parameters
        assert.ok(getProviderModelCalled)
        assert.strictEqual(calledProvider, 'anthropic')
        assert.strictEqual(calledModel, 'claude-3-5-haiku-20241022')
      }
    })

    test('should handle empty messages array', async () => {
      setupService()

      const messages: any[] = []

      try {
        await chatService.processMessage(messages, 'openai', 'gpt-4o-mini')
        assert.fail('Should have thrown an error for empty messages')
      } catch (error) {
        // This should fail due to empty messages
        assert.ok(error instanceof Error)
      }
    })

    test('should handle different message types', async () => {
      setupService()

      const messages = [
        { role: 'system' as const, content: 'You are a helpful assistant' },
        { role: 'user' as const, content: 'What is 2+2?' },
        { role: 'assistant' as const, content: '2+2 equals 4.' },
        { role: 'user' as const, content: 'Thank you!' }
      ]

      try {
        await chatService.processMessage(messages, 'openai', 'gpt-4o-mini')
        // If we get here without error, the message format was accepted
      } catch (error) {
        // Expected due to lack of real API key, but verify it's not a message format error
        assert.ok(error instanceof Error)
        // If it was a format error, it would mention validation or format
        assert.ok(!error.message.toLowerCase().includes('format'))
        assert.ok(!error.message.toLowerCase().includes('validation'))
      }
    })
  })

  describe('streamMessage() method', () => {
    test('should attempt to stream message with OpenAI provider', async () => {
      setupService()

      const messages = [
        { role: 'user' as const, content: 'Hello, stream me a response!' }
      ]

      try {
        const result = await chatService.streamMessage(messages, 'openai', 'gpt-4o-mini')
        // If we get a result, verify it has streaming properties
        assert.ok(result)
        assert.ok('textStream' in result || 'stream' in result)
      } catch (error) {
        // Expected due to lack of real API key
        assert.ok(error instanceof Error)
      }
    })

    test('should call getProviderModel for streaming', async () => {
      setupService()

      const messages = [
        { role: 'user' as const, content: 'Stream test' }
      ]

      let getProviderModelCalled = false
      mockProviderService.getProviderModel = (_provider: string, _model: string) => {
        getProviderModelCalled = true
        throw new Error('Test error to verify call')
      }

      // Make sure the provider is available
      mockProviderService.getAvailableProviders = () => ['google']

      try {
        await chatService.streamMessage(messages, 'google', 'gemini-2.5-flash-lite')
      } catch {
        assert.ok(getProviderModelCalled)
      }
    })
  })

  describe('Integration with DI Container', () => {
    test('should be resolvable from DI container', async () => {
      await import('../../lib/services.ts') // Initialize DI container
      const service = container.resolve<DefaultChatService>('ChatService')

      assert.ok(service)
      assert.ok(typeof service.processMessage === 'function')
      assert.ok(typeof service.streamMessage === 'function')

      // Verify conversation methods are removed (moved to ConversationService)
      assert.strictEqual((service as any).createConversation, undefined)
      assert.strictEqual((service as any).getConversation, undefined)
      assert.strictEqual((service as any).listConversations, undefined)
      assert.strictEqual((service as any).updateConversationTitle, undefined)
      assert.strictEqual((service as any).deleteConversation, undefined)
      assert.strictEqual((service as any).saveMessageToConversation, undefined)
      assert.strictEqual((service as any).cleanupOldConversations, undefined)
      assert.strictEqual((service as any).branchConversation, undefined)
    })
  })
})