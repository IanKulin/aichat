// Application state management
import { stateObserver } from "./observer.js";

// Conversation state
let _currentConversation = null;
let _conversationList = [];
let _autoSaveEnabled = true;
let _conversationHistory = [];

// Provider/model state
let _availableProviders = [];
let _selectedProvider = null;
let _selectedModel = null;

// API client
let _conversationAPI = null;

// DOM elements
export let chatContainer = null;
export let messageInput = null;
export let sendButton = null;
export let providerSelect = null;
export let modelSelect = null;
export let conversationSidebar = null;
export let conversationListEl = null;
export let conversationTitle = null;
export let newChatBtn = null;
export let sidebarCollapseBtn = null;
export let sidebarToggleMobile = null;
export let autoSaveToggle = null;
export let conversationSearch = null;

// State getters
export const getCurrentConversation = () => _currentConversation;
export const getConversationList = () => _conversationList;
export const getAutoSaveEnabled = () => _autoSaveEnabled;
export const getConversationHistory = () => _conversationHistory;
export const getAvailableProviders = () => _availableProviders;
export const getSelectedProvider = () => _selectedProvider;
export const getSelectedModel = () => _selectedModel;
export const getConversationAPI = () => _conversationAPI;

// State setters
export function setCurrentConversation(value) {
  const oldValue = _currentConversation;
  _currentConversation = value;

  // Notify subscribers
  stateObserver.notify("conversation:current-changed", {
    current: value,
    previous: oldValue,
  });
}

export function setConversationList(value) {
  const oldValue = _conversationList;
  _conversationList = value;

  // Notify subscribers
  stateObserver.notify("conversation:list-changed", {
    current: value,
    previous: oldValue,
  });
}

export function setAutoSaveEnabled(value) {
  const oldValue = _autoSaveEnabled;
  _autoSaveEnabled = value;

  // Notify subscribers
  stateObserver.notify("conversation:auto-save-changed", {
    current: value,
    previous: oldValue,
  });
}

export function setConversationHistory(value) {
  const oldValue = _conversationHistory;
  _conversationHistory = value;

  // Notify subscribers
  stateObserver.notify("conversation:history-changed", {
    current: value,
    previous: oldValue,
  });
}

export function addToConversationHistory(message) {
  _conversationHistory.push(message);

  // Notify subscribers
  stateObserver.notify("conversation:history-changed", {
    current: _conversationHistory,
    previous: _conversationHistory,
  });
}

export function popFromConversationHistory() {
  const message = _conversationHistory.pop();

  // Notify subscribers
  stateObserver.notify("conversation:history-changed", {
    current: _conversationHistory,
    previous: _conversationHistory,
  });

  return message;
}

export function setAvailableProviders(value) {
  _availableProviders = value;
}

export function setSelectedProvider(value) {
  _selectedProvider = value;
}

export function setSelectedModel(value) {
  _selectedModel = value;
}

export function setConversationAPI(value) {
  _conversationAPI = value;
}

// Initialize DOM references
export function initializeDOMReferences() {
  chatContainer = document.getElementById("chatContainer");
  messageInput = document.getElementById("messageInput");
  sendButton = document.getElementById("sendButton");
  providerSelect = document.getElementById("providerSelect");
  modelSelect = document.getElementById("modelSelect");
  conversationSidebar = document.getElementById("conversationSidebar");
  conversationListEl = document.getElementById("conversationList");
  conversationTitle = document.getElementById("conversationTitle");
  newChatBtn = document.getElementById("newChatBtn");
  sidebarCollapseBtn = document.getElementById("sidebarCollapseBtn");
  sidebarToggleMobile = document.getElementById("sidebarToggleMobile");
  autoSaveToggle = document.getElementById("autoSaveToggle");
  conversationSearch = document.getElementById("conversationSearch");
}
