// UI helper functions
import { chatContainer, setConversationList } from './state.js';

export function addMessage(content, type = "user", metadata = null) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;

  if (type === "assistant" && metadata) {
    // Create content with provider info
    const contentDiv = document.createElement("div");
    contentDiv.innerHTML = DOMPurify.sanitize(content);

    const providerInfo = document.createElement("div");
    providerInfo.className = "provider-info";
    providerInfo.textContent = `${metadata.providerName} • ${metadata.model}`;

    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(providerInfo);
  } else {
    messageDiv.innerHTML = DOMPurify.sanitize(content);
  }

  chatContainer.appendChild(messageDiv);

  // Apply syntax highlighting to any new code blocks
  if (type === "assistant") {
    hljs.highlightAll();
    addCopyButtonsToCodeBlocks();
  }

  scrollToBottom();
}

export function addError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error";
  errorDiv.textContent = message;

  chatContainer.appendChild(errorDiv);
  scrollToBottom();
}

export function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

export function addSkeletonMessage() {
  const skeletonDiv = document.createElement("div");
  skeletonDiv.className = "message skeleton";
  skeletonDiv.id = "skeleton-message";
  skeletonDiv.setAttribute("role", "status");
  skeletonDiv.setAttribute("aria-live", "polite");
  skeletonDiv.setAttribute("aria-label", "AI is responding");

  skeletonDiv.innerHTML = `
    <div class="skeleton-content">
      <div class="skeleton-thinking-text">AI is thinking...</div>
      <div class="skeleton-line skeleton-line-long"></div>
      <div class="skeleton-line skeleton-line-medium"></div>
      <div class="skeleton-line skeleton-line-short"></div>
    </div>
    <div class="message-content" style="display: none;"></div>
  `;

  chatContainer.appendChild(skeletonDiv);
  scrollToBottom();
}

export function transformSkeletonToMessage(content, metadata = null) {
  const skeletonMessage = document.getElementById("skeleton-message");
  if (!skeletonMessage) return null;

  const skeletonContent = skeletonMessage.querySelector('.skeleton-content');
  const messageContent = skeletonMessage.querySelector('.message-content');

  // Prepare the actual message content
  if (metadata) {
    // Create content with provider info
    const contentDiv = document.createElement("div");
    contentDiv.innerHTML = DOMPurify.sanitize(content);

    const providerInfo = document.createElement("div");
    providerInfo.className = "provider-info";
    providerInfo.textContent = `${metadata.providerName} • ${metadata.model}`;

    messageContent.appendChild(contentDiv);
    messageContent.appendChild(providerInfo);
  } else {
    messageContent.innerHTML = DOMPurify.sanitize(content);
  }

  // Show the message content
  messageContent.style.display = 'block';

  // Start the transition
  skeletonContent.classList.add('fade-out');

  setTimeout(() => {
    messageContent.classList.add('fade-in');
    // Remove skeleton class and update attributes
    skeletonMessage.classList.remove('skeleton');
    skeletonMessage.className = 'message assistant';
    skeletonMessage.removeAttribute('role');
    skeletonMessage.removeAttribute('aria-live');
    skeletonMessage.removeAttribute('aria-label');
    skeletonMessage.removeAttribute('id');

    // Apply syntax highlighting to any new code blocks
    hljs.highlightAll();
    addCopyButtonsToCodeBlocks();

    // Remove skeleton content after transition
    setTimeout(() => {
      if (skeletonContent) {
        skeletonContent.remove();
      }
    }, 300);
  }, 150); // Small delay for better visual timing

  return skeletonMessage;
}

export function removeSkeletonMessage() {
  const skeletonMessage = document.getElementById("skeleton-message");
  if (skeletonMessage) {
    skeletonMessage.remove();
  }
}

export function addCopyButtonsToCodeBlocks() {
  const codeBlocks = document.querySelectorAll('.message.assistant pre:not(.copy-button-added)');

  codeBlocks.forEach(pre => {
    // Mark this code block as processed
    pre.classList.add('copy-button-added');

    // Create wrapper div if it doesn't exist
    if (!pre.parentElement.classList.contains('code-block-wrapper')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';
      pre.parentElement.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);
    }

    // Create copy button
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.textContent = 'Copy';
    copyButton.setAttribute('aria-label', 'Copy code to clipboard');

    // Add click handler
    copyButton.addEventListener('click', async () => {
      try {
        const codeElement = pre.querySelector('code');
        const textToCopy = codeElement ? codeElement.textContent : pre.textContent;

        await navigator.clipboard.writeText(textToCopy);

        // Visual feedback
        const originalText = copyButton.textContent;
        copyButton.textContent = 'Copied!';
        copyButton.classList.add('copied');

        setTimeout(() => {
          copyButton.textContent = originalText;
          copyButton.classList.remove('copied');
        }, 2000);

      } catch (err) {
        // Fallback for older browsers or when clipboard API fails
        console.warn('Failed to copy to clipboard:', err);

        // Try older method
        try {
          const textArea = document.createElement('textarea');
          const codeElement = pre.querySelector('code');
          textArea.value = codeElement ? codeElement.textContent : pre.textContent;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);

          // Visual feedback
          const originalText = copyButton.textContent;
          copyButton.textContent = 'Copied!';
          copyButton.classList.add('copied');

          setTimeout(() => {
            copyButton.textContent = originalText;
            copyButton.classList.remove('copied');
          }, 2000);

        } catch (fallbackErr) {
          // If all else fails, show error feedback
          const originalText = copyButton.textContent;
          copyButton.textContent = 'Failed';

          setTimeout(() => {
            copyButton.textContent = originalText;
          }, 2000);
        }
      }
    });

    // Add button to wrapper
    pre.parentElement.appendChild(copyButton);
  });
}

export function showError(message, duration = 5000) {
  // Create or update error element
  let errorEl = document.querySelector('.app-error');
  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.className = 'app-error';
    errorEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--error-bg);
      color: var(--error-text);
      border: 1px solid var(--error-border);
      border-radius: var(--radius-md);
      padding: var(--spacing-md) var(--spacing-lg);
      z-index: 10000;
      max-width: 300px;
    `;
    document.body.appendChild(errorEl);
  }

  errorEl.textContent = message;
  errorEl.style.display = 'block';

  setTimeout(() => {
    errorEl.style.display = 'none';
  }, duration);
}

export function showSuccess(message, duration = 3000) {
  // Create or update success element
  let successEl = document.querySelector('.app-success');
  if (!successEl) {
    successEl = document.createElement('div');
    successEl.className = 'app-success';
    successEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
      border-radius: var(--radius-md);
      padding: var(--spacing-md) var(--spacing-lg);
      z-index: 10000;
      max-width: 300px;
    `;
    document.body.appendChild(successEl);
  }

  successEl.textContent = message;
  successEl.style.display = 'block';

  setTimeout(() => {
    successEl.style.display = 'none';
  }, duration);
}

export function showConversationLoader() {
  const loader = document.createElement('div');
  loader.id = 'conversationLoader';
  loader.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: var(--text-secondary);
  `;
  loader.textContent = 'Loading conversation...';
  chatContainer.style.position = 'relative';
  chatContainer.appendChild(loader);
}

export function hideConversationLoader() {
  const loader = document.getElementById('conversationLoader');
  if (loader) {
    loader.remove();
  }
}

export function showSaveIndicator() {
  // Brief visual feedback for save operations
  const indicator = document.createElement('div');
  indicator.style.cssText = `
    position: fixed;
    bottom: 100px;
    right: 20px;
    background: var(--primary-color);
    color: white;
    padding: var(--spacing-xs) var(--spacing-md);
    border-radius: var(--radius-md);
    font-size: 12px;
    z-index: 1000;
    opacity: 0.8;
  `;
  indicator.textContent = 'Saved';
  document.body.appendChild(indicator);

  setTimeout(() => {
    indicator.remove();
  }, 1000);
}

export function filterConversations(query, conversationList, updateConversationListUI) {
  if (!query.trim()) {
    updateConversationListUI();
    return;
  }

  const filtered = conversationList.filter(conv =>
    conv.title.toLowerCase().includes(query.toLowerCase())
  );

  // Temporarily update the conversation list for display purposes
  const originalList = conversationList.slice(); // Create a copy
  setConversationList(filtered);
  updateConversationListUI();
  setConversationList(originalList);
}
