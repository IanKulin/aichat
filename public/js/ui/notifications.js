// Toast notifications and loading indicators
import { chatContainer } from "../state.js";

export function showError(message, duration = 5000) {
  // Create or update error element
  let errorEl = document.querySelector(".app-error");
  if (!errorEl) {
    errorEl = document.createElement("div");
    errorEl.className = "app-error";
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
  errorEl.style.display = "block";

  setTimeout(() => {
    errorEl.style.display = "none";
  }, duration);
}

export function showSuccess(message, duration = 3000) {
  // Create or update success element
  let successEl = document.querySelector(".app-success");
  if (!successEl) {
    successEl = document.createElement("div");
    successEl.className = "app-success";
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
  successEl.style.display = "block";

  setTimeout(() => {
    successEl.style.display = "none";
  }, duration);
}

export function showConversationLoader() {
  const loader = document.createElement("div");
  loader.id = "conversationLoader";
  loader.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: var(--text-secondary);
  `;
  loader.textContent = "Loading conversation...";
  chatContainer.style.position = "relative";
  chatContainer.appendChild(loader);
}

export function hideConversationLoader() {
  const loader = document.getElementById("conversationLoader");
  if (loader) {
    loader.remove();
  }
}

export function showSaveIndicator() {
  // Brief visual feedback for save operations
  const indicator = document.createElement("div");
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
  indicator.textContent = "Saved";
  document.body.appendChild(indicator);

  setTimeout(() => {
    indicator.remove();
  }, 1000);
}
