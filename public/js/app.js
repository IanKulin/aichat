// Main application logic and initialization
import {
  initializeDOMReferences,
  setConversationAPI,
  setAvailableProviders,
  setSelectedProvider,
  setSelectedModel,
  setAutoSaveEnabled,
  getAvailableProviders,
  getSelectedProvider,
  getSelectedModel,
  getConversationList,
  providerSelect,
  modelSelect,
  messageInput,
  newChatBtn,
  sidebarCollapseBtn,
  sidebarToggleMobile,
  autoSaveToggle,
  conversationSearch,
  conversationSidebar
} from './state.js';
import { showError, filterConversations } from './ui.js';
import { sendMessage } from './chat.js';
import { clearConversation, refreshConversationList, updateConversationListUI } from './conversations.js';

// Provider/model selection functions
async function loadProviders() {
  try {
    const response = await fetch("/api/providers");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    setAvailableProviders(data.providers || []);

    const availableProviders = getAvailableProviders();

    // Populate provider dropdown
    providerSelect.innerHTML = "";
    if (availableProviders.length === 0) {
      providerSelect.innerHTML = '<option value="">No providers available</option>';
      return;
    }

    availableProviders.forEach(provider => {
      const option = document.createElement("option");
      option.value = provider.id;
      option.textContent = provider.name;
      providerSelect.appendChild(option);
    });

    // Set default provider
    if (data.default && availableProviders.length > 0) {
      setSelectedProvider(data.default);
      providerSelect.value = getSelectedProvider();
      loadModelsForProvider(getSelectedProvider());
    }

  } catch (error) {
    console.error("Error loading providers:", error);
    providerSelect.innerHTML = '<option value="">Error loading providers</option>';
  }
}

function loadModelsForProvider(providerId) {
  const availableProviders = getAvailableProviders();
  const provider = availableProviders.find(p => p.id === providerId);
  if (!provider) return;

  // Clear and populate model dropdown
  modelSelect.innerHTML = "";
  provider.models.forEach(model => {
    const option = document.createElement("option");
    option.value = model;
    option.textContent = model;
    modelSelect.appendChild(option);
  });

  // Set default model
  setSelectedModel(provider.defaultModel);
  modelSelect.value = getSelectedModel();
}

// LocalStorage persistence
function saveUserSelection() {
  const selectedProvider = getSelectedProvider();
  const selectedModel = getSelectedModel();
  if (selectedProvider && selectedModel) {
    localStorage.setItem("preferredProvider", selectedProvider);
    localStorage.setItem("preferredModel", selectedModel);
  }
}

function loadUserSelection() {
  const savedProvider = localStorage.getItem("preferredProvider");
  const savedModel = localStorage.getItem("preferredModel");

  if (savedProvider && savedModel) {
    const availableProviders = getAvailableProviders();
    // Check if saved provider is still available
    const provider = availableProviders.find(p => p.id === savedProvider);
    if (provider && provider.models.includes(savedModel)) {
      setSelectedProvider(savedProvider);
      providerSelect.value = savedProvider;
      loadModelsForProvider(savedProvider);
      setSelectedModel(savedModel); // Set after loadModelsForProvider to prevent state overwrite
      modelSelect.value = savedModel;
    }
  }
}

function loadSavedSettings() {
  // Load auto-save setting
  const savedAutoSave = localStorage.getItem('autoSaveEnabled');
  if (savedAutoSave !== null) {
    const autoSaveValue = savedAutoSave === 'true';
    setAutoSaveEnabled(autoSaveValue);
    autoSaveToggle.checked = autoSaveValue;
  }

  // Load sidebar collapse state
  const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  if (sidebarCollapsed) {
    conversationSidebar.classList.add('collapsed');
  }

  // Set initial tooltip text
  sidebarCollapseBtn.title = sidebarCollapsed ? 'Open chat history' : 'Close chat history';
}

function toggleSidebarCollapse() {
  conversationSidebar.classList.toggle('collapsed');
  const isCollapsed = conversationSidebar.classList.contains('collapsed');

  // Update tooltip text based on state
  sidebarCollapseBtn.title = isCollapsed ? 'Open chat history' : 'Close chat history';

  localStorage.setItem('sidebarCollapsed', isCollapsed);
}

// Initialize app
async function initializeApp() {
  try {
    // Initialize DOM references first
    initializeDOMReferences();

    // Initialize API client
    setConversationAPI(new ConversationAPI());

    // Initialize highlight.js
    hljs.highlightAll();

    // Setup event listeners
    setupEventListeners();

    // Load settings and data
    loadSavedSettings();
    await loadProviders();
    loadUserSelection();
    await refreshConversationList();
    messageInput.focus();
  } catch (error) {
    console.error('Failed to initialize app:', error);
    showError('Failed to initialize application');
  }
}

function setupEventListeners() {
  // Auto-resize textarea
  messageInput.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 120) + "px";
  });

  // Send message on Enter (but allow Shift+Enter for new lines)
  messageInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Send button click handler
  document.getElementById("sendButton").addEventListener("click", function(e) {
    e.preventDefault();
    sendMessage();
  });

  // Handle form submission
  document.querySelector('form').addEventListener('submit', function(e) {
    e.preventDefault();
    sendMessage();
  });

  // Provider selection change handler
  providerSelect.addEventListener("change", function() {
    setSelectedProvider(this.value);
    if (this.value) {
      loadModelsForProvider(this.value);
      saveUserSelection();
    }
  });

  // Model selection change handler
  modelSelect.addEventListener("change", function() {
    setSelectedModel(this.value);
    saveUserSelection();
  });

  // New chat button
  newChatBtn.addEventListener('click', async () => {
    await clearConversation();
  });

  // Sidebar collapse button
  sidebarCollapseBtn.addEventListener('click', toggleSidebarCollapse);

  // Mobile sidebar toggle
  sidebarToggleMobile.addEventListener('click', () => {
    conversationSidebar.classList.toggle('open');
    // Add overlay for mobile
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', () => {
        conversationSidebar.classList.remove('open');
        overlay.classList.remove('show');
      });
    }
    overlay.classList.toggle('show', conversationSidebar.classList.contains('open'));
  });

  // Auto-save toggle
  autoSaveToggle.addEventListener('change', (e) => {
    setAutoSaveEnabled(e.target.checked);
    localStorage.setItem('autoSaveEnabled', e.target.checked);
  });

  // Conversation search
  conversationSearch.addEventListener('input', (e) => {
    filterConversations(e.target.value, getConversationList(), updateConversationListUI);
  });
}

// Initialize on page load
initializeApp();
