// Conversation management
import {
  getCurrentConversation,
  getConversationList,
  getConversationHistory,
  getConversationAPI,
  getSelectedProvider,
  getSelectedModel,
  chatContainer,
  conversationTitle,
  conversationListEl,
  setCurrentConversation,
  setConversationList,
  setConversationHistory,
} from "./state.js";
import {
  addMessage,
  showError,
  showSuccess,
  showConversationLoader,
  hideConversationLoader,
  addCopyButtonsToCodeBlocks,
  addBranchButtonsToMessages,
} from "./ui/index.js";

export async function clearConversation() {
  // Reset conversation state
  setCurrentConversation(null);
  setConversationHistory([]);

  // Clear chat display
  chatContainer.innerHTML = "";

  // Update UI - no title initially
  conversationTitle.textContent = "";

  // Refresh conversation list to show any previously created conversations
  await refreshConversationList();

  // Focus input
  const messageInput = document.getElementById("messageInput");
  messageInput.focus();
}

export async function createNewConversation() {
  try {
    const conversationAPI = getConversationAPI();
    // Create conversation without title initially
    const conversation = await conversationAPI.createConversation("Untitled");
    setCurrentConversation(conversation);

    // Don't set title yet - it will be set after first response
    refreshConversationList();

    return conversation;
  } catch (error) {
    console.error("Failed to create conversation:", error);
    showError("Failed to create new conversation");
    return null;
  }
}

export async function generateAndSetTitle(firstMessage) {
  const currentConversation = getCurrentConversation();
  if (!currentConversation || !firstMessage) return;

  try {
    const conversationAPI = getConversationAPI();
    const selectedProvider = getSelectedProvider();
    const selectedModel = getSelectedModel();

    const titleResponse = await conversationAPI.generateTitle(
      firstMessage,
      selectedProvider,
      selectedModel
    );

    if (titleResponse.title) {
      // Update the conversation title
      await updateConversationTitle(
        currentConversation.id,
        titleResponse.title
      );
    }
  } catch (error) {
    console.warn("Failed to generate title:", error);
    // Fallback to a simple title
    await updateConversationTitle(currentConversation.id, "Chat");
  }
}

export async function loadConversation(conversationId) {
  try {
    showConversationLoader();

    const conversationAPI = getConversationAPI();
    const conversation = await conversationAPI.getConversation(conversationId);
    setCurrentConversation(conversation);

    // Load messages into UI
    setConversationHistory(conversation.messages || []);

    // Clear and rebuild chat display
    chatContainer.innerHTML = "";

    const conversationHistory = getConversationHistory();
    if (conversationHistory.length === 0) {
      // Leave chat container empty for new conversations
    } else {
      conversationHistory.forEach((msg) => {
        const metadata =
          msg.provider && msg.model
            ? {
                providerName: msg.provider,
                model: msg.model,
              }
            : null;

        // Pass timestamp for assistant messages to enable branching
        const messageTimestamp =
          msg.role === "assistant" && msg.timestamp
            ? new Date(msg.timestamp).getTime()
            : null;

        addMessage(msg.content, msg.role, metadata, messageTimestamp);
      });

      // Add copy buttons to any code blocks from loaded conversation
      addCopyButtonsToCodeBlocks();

      // Add branch buttons to all assistant messages except the last one
      addBranchButtonsToMessages();
    }

    conversationTitle.textContent = conversation.title;

    hideConversationLoader();
  } catch (error) {
    console.error("Failed to load conversation:", error);
    showError("Failed to load conversation");
    hideConversationLoader();
  }
}

export async function updateConversationTitle(id, newTitle) {
  try {
    const conversationAPI = getConversationAPI();
    await conversationAPI.updateConversationTitle(id, newTitle);
    const currentConversation = getCurrentConversation();
    if (currentConversation && currentConversation.id === id) {
      currentConversation.title = newTitle;
      conversationTitle.textContent = newTitle;
    }
    // Refresh list to show updated title
    refreshConversationList();
  } catch (error) {
    console.error("Failed to update conversation title:", error);
    showError("Failed to update title");
  }
}

export async function deleteConversation(id) {
  if (!confirm("Are you sure you want to delete this conversation?")) return;

  try {
    const conversationAPI = getConversationAPI();
    await conversationAPI.deleteConversation(id);

    // If we're deleting the current conversation, clear it
    const currentConversation = getCurrentConversation();
    if (currentConversation && currentConversation.id === id) {
      clearConversation();
    }

    refreshConversationList();
    showSuccess("Conversation deleted");
  } catch (error) {
    console.error("Failed to delete conversation:", error);
    showError("Failed to delete conversation");
  }
}

export async function handleBranchClick(messageTimestamp) {
  try {
    const currentConversation = getCurrentConversation();

    if (!currentConversation) {
      showError("No active conversation to branch from");
      return;
    }

    if (!messageTimestamp || messageTimestamp <= 0) {
      showError("Invalid message timestamp");
      return;
    }

    const newTitle = currentConversation.title + " (Branch)";

    // Show loading state
    const branchButtons = document.querySelectorAll(".branch-button");
    branchButtons.forEach((btn) => {
      if (btn.getAttribute("data-timestamp") === String(messageTimestamp)) {
        btn.classList.add("branching");
        btn.textContent = "Branching...";
      }
    });

    // Call API
    const conversationAPI = getConversationAPI();
    const branchedConversation = await conversationAPI.branchConversation(
      currentConversation.id,
      messageTimestamp,
      newTitle
    );

    // Load new conversation
    await loadConversation(branchedConversation.id);
    showSuccess("Conversation branched successfully");
  } catch (error) {
    console.error("Failed to branch conversation:", error);
    showError("Failed to branch conversation");

    // Reset button state
    const branchButtons = document.querySelectorAll(".branch-button.branching");
    branchButtons.forEach((btn) => {
      btn.classList.remove("branching");
      btn.innerHTML = "⎇ Branch";
    });
  }
}

export async function refreshConversationList() {
  try {
    const conversationAPI = getConversationAPI();
    const data = await conversationAPI.listConversations(50, 0);
    setConversationList(data.conversations || []);
  } catch (error) {
    console.error("Failed to refresh conversation list:", error);
  }
}

export function updateConversationListUI() {
  let emptyState = document.getElementById("conversationListEmpty");

  const conversationList = getConversationList();
  if (conversationList.length === 0) {
    // Create empty state element if it doesn't exist
    if (!emptyState) {
      emptyState = document.createElement("div");
      emptyState.className = "conversation-list-empty";
      emptyState.id = "conversationListEmpty";
      emptyState.textContent =
        "No conversations yet. Start chatting to create your first conversation!";
    }

    conversationListEl.innerHTML = "";
    conversationListEl.appendChild(emptyState);
    return;
  }

  // Hide empty state if it exists
  if (emptyState) {
    emptyState.style.display = "none";
  }

  conversationListEl.innerHTML = "";

  conversationList.forEach((conversation) => {
    const item = createConversationListItem(conversation);
    conversationListEl.appendChild(item);
  });
}

export function createConversationListItem(conversation) {
  const item = document.createElement("div");
  item.className = "conversation-item";
  const currentConversation = getCurrentConversation();
  if (currentConversation && currentConversation.id === conversation.id) {
    item.classList.add("active");
  }

  item.innerHTML = `
    <div class="conversation-title">${ConversationUtils.truncateText(conversation.title, 40)}</div>
    <div class="conversation-meta">
      <span>${ConversationUtils.formatConversationDate(conversation.updatedAt)}</span>
      <span>${conversation.messageCount || 0} messages</span>
    </div>
    <div class="conversation-actions">
      <button class="action-btn delete-btn" data-id="${conversation.id}" title="Delete">🗑</button>
    </div>
  `;

  // Add click handler for loading conversation
  item.addEventListener("click", (e) => {
    if (!e.target.classList.contains("action-btn")) {
      loadConversation(conversation.id);
    }
  });

  // Add handlers for action buttons
  item.querySelector(".delete-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    deleteConversation(conversation.id);
  });

  return item;
}
