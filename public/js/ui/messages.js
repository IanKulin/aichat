// Message rendering and display
import { chatContainer } from "../state.js";
import { addCopyButtonsToCodeBlocks } from "./code-blocks.js";
import { addButtonToPreviousAssistant } from "./branching.js";

export function addMessage(
  content,
  type = "user",
  metadata = null,
  messageTimestamp = null
) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;

  // Add timestamp data attribute if provided
  if (messageTimestamp) {
    messageDiv.setAttribute("data-timestamp", messageTimestamp);
  }

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

    // Add branch button to previous assistant message (if any)
    addButtonToPreviousAssistant();
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

export function transformSkeletonToMessage(
  content,
  metadata = null,
  messageTimestamp = null
) {
  const skeletonMessage = document.getElementById("skeleton-message");
  if (!skeletonMessage) return null;

  const skeletonContent = skeletonMessage.querySelector(".skeleton-content");
  const messageContent = skeletonMessage.querySelector(".message-content");

  // Set timestamp if provided (for branching functionality)
  const timestamp = messageTimestamp || Date.now();
  skeletonMessage.setAttribute("data-timestamp", timestamp);

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
  messageContent.style.display = "block";

  // Start the transition
  skeletonContent.classList.add("fade-out");

  setTimeout(() => {
    messageContent.classList.add("fade-in");
    // Remove skeleton class and update attributes
    skeletonMessage.classList.remove("skeleton");
    skeletonMessage.className = "message assistant";
    skeletonMessage.removeAttribute("role");
    skeletonMessage.removeAttribute("aria-live");
    skeletonMessage.removeAttribute("aria-label");
    skeletonMessage.removeAttribute("id");

    // Apply syntax highlighting to any new code blocks
    hljs.highlightAll();
    addCopyButtonsToCodeBlocks();

    // Add branch button to previous assistant message (if any)
    addButtonToPreviousAssistant();

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
