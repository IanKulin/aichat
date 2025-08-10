/**
 * API client for conversation management and chat persistence
 */
class ConversationAPI {
  constructor() {
    this.baseURL = '/api';
  }

  /**
   * Create a new conversation
   * @param {string} title - Conversation title
   * @returns {Promise<Object>} Created conversation object
   */
  async createConversation(title) {
    const response = await fetch(`${this.baseURL}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create conversation: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get conversation by ID with messages
   * @param {string} id - Conversation ID
   * @returns {Promise<Object>} Conversation with messages
   */
  async getConversation(id) {
    const response = await fetch(`${this.baseURL}/conversations/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to get conversation: ${response.status}`);
    }

    return response.json();
  }

  /**
   * List conversations with pagination
   * @param {number} limit - Number of conversations to fetch (default: 50)
   * @param {number} offset - Offset for pagination (default: 0)
   * @returns {Promise<Object>} Conversations list with metadata
   */
  async listConversations(limit = 50, offset = 0) {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    const response = await fetch(`${this.baseURL}/conversations?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to list conversations: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Update conversation title
   * @param {string} id - Conversation ID
   * @param {string} title - New title
   * @returns {Promise<Object>} Updated conversation
   */
  async updateConversationTitle(id, title) {
    const response = await fetch(`${this.baseURL}/conversations/${id}/title`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update conversation title: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Delete conversation
   * @param {string} id - Conversation ID
   * @returns {Promise<void>}
   */
  async deleteConversation(id) {
    const response = await fetch(`${this.baseURL}/conversations/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete conversation: ${response.status}`);
    }
  }

  /**
   * Save message to conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} role - Message role (user, assistant, system)
   * @param {string} content - Message content
   * @param {string} provider - AI provider used
   * @param {string} model - AI model used
   * @returns {Promise<Object>} Saved message
   */
  async saveMessage(conversationId, role, content, provider = null, model = null) {
    const messageData = {
      conversationId,
      role,
      content,
    };

    if (provider) messageData.provider = provider;
    if (model) messageData.model = model;

    const response = await fetch(`${this.baseURL}/conversations/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
    });

    if (!response.ok) {
      throw new Error(`Failed to save message: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Send message with persistence - combines chat API with message saving
   * @param {string} conversationId - Conversation ID
   * @param {Array} messages - Conversation history
   * @param {string} provider - AI provider
   * @param {string} model - AI model
   * @returns {Promise<Object>} Chat response with persistence metadata
   */
  async sendMessageWithPersistence(conversationId, messages, provider, model) {
    // Send to chat API
    const chatResponse = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        messages,
        provider,
        model
      }),
    });

    if (!chatResponse.ok) {
      throw new Error(`Chat API error: ${chatResponse.status}`);
    }

    const chatData = await chatResponse.json();

    // Save assistant response to database
    if (chatData.response && conversationId) {
      try {
        await this.saveMessage(
          conversationId,
          'assistant',
          chatData.response,
          chatData.provider,
          chatData.model
        );
      } catch (error) {
        console.warn('Failed to save assistant message:', error);
        // Don't fail the entire request if persistence fails
      }
    }

    return chatData;
  }

  /**
   * Retry wrapper for API calls
   * @param {Function} fn - Function to retry
   * @param {number} maxRetries - Maximum retry attempts
   * @param {number} delay - Delay between retries (ms)
   * @returns {Promise<any>} Result of function call
   */
  async withRetry(fn, maxRetries = 3, delay = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }

    throw lastError;
  }
}

// Utility functions for conversation management
class ConversationUtils {
  /**
   * Generate a conversation title from the first message
   * @param {string} firstMessage - First user message
   * @returns {string} Generated title
   */
  static generateConversationTitle(firstMessage) {
    if (!firstMessage || !firstMessage.trim()) {
      return `New Chat - ${new Date().toLocaleDateString()}`;
    }

    // Clean and truncate the message
    const cleaned = firstMessage
      .trim()
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ');

    // Extract meaningful title (first sentence or 50 characters)
    let title = cleaned;
    
    // Try to get first sentence
    const sentenceEnd = cleaned.match(/[.!?]/);
    if (sentenceEnd && sentenceEnd.index < 80) {
      title = cleaned.substring(0, sentenceEnd.index + 1);
    } else if (cleaned.length > 50) {
      // Truncate at word boundary
      const truncated = cleaned.substring(0, 50);
      const lastSpace = truncated.lastIndexOf(' ');
      title = lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
    }

    return title;
  }

  /**
   * Check if conversation title should be auto-updated
   * @param {Object} conversation - Conversation object
   * @param {number} messageCount - Current message count
   * @returns {boolean} Whether to auto-update title
   */
  static shouldAutoUpdateTitle(conversation, messageCount) {
    // Don't auto-update if user has set a custom title
    if (conversation.title && !conversation.title.startsWith('New Chat')) {
      return false;
    }

    // Auto-update for the first few messages
    return messageCount <= 3;
  }

  /**
   * Format conversation date for display
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Formatted date string
   */
  static formatConversationDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes < 1 ? 'Just now' : `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Truncate text for display
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  static truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) {
      return text;
    }

    return text.substring(0, maxLength).trim() + '...';
  }
}

// Export for use in HTML
if (typeof window !== 'undefined') {
  window.ConversationAPI = ConversationAPI;
  window.ConversationUtils = ConversationUtils;
}