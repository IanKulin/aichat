// Branch button logic for conversation branching

/**
 * Add branch button to a message div
 * @param {HTMLElement} messageDiv - Message div element
 * @param {number} messageTimestamp - Message timestamp
 */
export function addBranchButton(messageDiv, messageTimestamp) {
  // Don't add button if already exists
  if (messageDiv.querySelector(".branch-button")) {
    return;
  }

  const branchButton = document.createElement("button");
  branchButton.className = "branch-button";
  branchButton.innerHTML = "⎇ Branch";
  branchButton.setAttribute("data-timestamp", messageTimestamp);

  branchButton.addEventListener("click", async (e) => {
    e.stopPropagation();
    const { handleBranchClick } = await import("../conversations.js");
    await handleBranchClick(messageTimestamp);
  });

  messageDiv.appendChild(branchButton);
}

/**
 * Helper to add button to previous assistant message when new one arrives
 */
export function addButtonToPreviousAssistant() {
  const assistantMessages = document.querySelectorAll(".message.assistant");
  if (assistantMessages.length >= 2) {
    // Get second-to-last assistant message
    const previousAssistant = assistantMessages[assistantMessages.length - 2];
    const timestamp = previousAssistant.getAttribute("data-timestamp");
    if (timestamp && !previousAssistant.querySelector(".branch-button")) {
      addBranchButton(previousAssistant, parseInt(timestamp));
    }
  }
}

/**
 * Add branch buttons to all assistant messages except the last one
 * Useful after loading a conversation
 */
export function addBranchButtonsToMessages() {
  const assistantMessages = document.querySelectorAll(".message.assistant");

  // Add buttons to all except the last assistant message
  assistantMessages.forEach((messageDiv, index) => {
    // Skip the last assistant message
    if (index === assistantMessages.length - 1) {
      return;
    }

    const timestamp = messageDiv.getAttribute("data-timestamp");
    if (timestamp && !messageDiv.querySelector(".branch-button")) {
      addBranchButton(messageDiv, parseInt(timestamp));
    }
  });
}
