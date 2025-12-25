// Conversation filtering logic
import { setConversationList } from "../state.js";

export function filterConversations(
  query,
  conversationList,
  updateConversationListUI
) {
  if (!query.trim()) {
    updateConversationListUI();
    return;
  }

  const filtered = conversationList.filter((conv) =>
    conv.title.toLowerCase().includes(query.toLowerCase())
  );

  // Temporarily update the conversation list for display purposes
  const originalList = conversationList.slice(); // Create a copy
  setConversationList(filtered);
  updateConversationListUI();
  setConversationList(originalList);
}
