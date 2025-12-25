// Chat functionality
import {
  getCurrentConversation,
  getConversationHistory,
  getAutoSaveEnabled,
  getConversationAPI,
  getSelectedProvider,
  getSelectedModel,
  messageInput,
  sendButton,
  addToConversationHistory,
  popFromConversationHistory,
} from "./state.js";
import {
  addMessage,
  addError,
  transformSkeletonToMessage,
  removeSkeletonMessage,
  addSkeletonMessage,
} from "./ui.js";
import {
  createNewConversation,
  generateAndSetTitle,
  refreshConversationList,
} from "./conversations.js";

export function setLoading(isLoading) {
  sendButton.disabled = isLoading;
  messageInput.disabled = isLoading;

  if (isLoading) {
    sendButton.textContent = "⏳";
    addSkeletonMessage();
  } else {
    sendButton.textContent = "➤";
    removeSkeletonMessage();
  }
}

export async function sendMessage() {
  const message = messageInput.value.trim();

  if (!message) {
    return;
  }

  const conversationHistory = getConversationHistory();
  const currentConversation = getCurrentConversation();
  const autoSaveEnabled = getAutoSaveEnabled();
  const conversationAPI = getConversationAPI();
  const selectedProvider = getSelectedProvider();
  const selectedModel = getSelectedModel();

  // Remember if this is the first message for title generation
  const isFirstMessage = conversationHistory.length === 0;
  const firstUserMessage = isFirstMessage ? message : null;

  // Create conversation if needed
  if (!currentConversation && autoSaveEnabled) {
    const newConv = await createNewConversation();
    if (!newConv) {
      // Failed to create conversation, continue without persistence
      console.warn(
        "Continuing without persistence due to conversation creation failure"
      );
    }
  }

  // Add user message to conversation history
  addToConversationHistory({ role: "user", content: message });

  // Add user message to chat display
  addMessage(message, "user");

  // Save user message to database if we have a conversation
  const updatedCurrentConv = getCurrentConversation();
  if (updatedCurrentConv && autoSaveEnabled) {
    try {
      await conversationAPI.saveMessage(updatedCurrentConv.id, "user", message);
    } catch (error) {
      console.warn("Failed to save user message:", error);
    }
  }

  // Clear input and reset height
  messageInput.value = "";
  messageInput.style.height = "auto";

  // Set loading state
  setLoading(true);

  let data;
  try {
    if (updatedCurrentConv && autoSaveEnabled) {
      // Use the persistence-aware API
      data = await conversationAPI.sendMessageWithPersistence(
        updatedCurrentConv.id,
        getConversationHistory(),
        selectedProvider,
        selectedModel
      );
    } else {
      // Fall back to direct chat API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: getConversationHistory(),
          provider: selectedProvider,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      data = await response.json();
    }

    // Add assistant response to chat
    if (data.response) {
      // Add to conversation history
      addToConversationHistory({
        role: "assistant",
        content: data.response,
      });

      // Disable loading cleanup - transformation will handle skeleton removal
      sendButton.disabled = false;
      messageInput.disabled = false;
      sendButton.textContent = "➤";

      // Transform skeleton to actual message with provider metadata
      transformSkeletonToMessage(data.response, {
        providerName: data.providerName,
        model: data.model,
      });

      // Generate title after first response
      const finalCurrentConv = getCurrentConversation();
      if (firstUserMessage && finalCurrentConv) {
        await generateAndSetTitle(firstUserMessage);
      }

      // Update conversation list (conversation was modified)
      if (finalCurrentConv) {
        refreshConversationList();
      }
    } else {
      throw new Error("No response received from server");
    }
  } catch (error) {
    console.error("Error sending message:", error);
    addError(`Error: ${error.message}`);

    // Remove the failed user message from history
    popFromConversationHistory();
  } finally {
    // Note: If we got a response, we already re-enabled the UI above
    // Only call setLoading(false) if there was an error (skeleton needs cleanup)
    if (!data || !data.response) {
      setLoading(false);
    }
    messageInput.focus();
  }
}
