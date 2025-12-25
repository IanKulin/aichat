import { showError, showSuccess } from "./ui/index.js";

class SettingsAPI {
  constructor() {
    this.baseURL = "/api/settings";
  }

  async getApiKeys() {
    const response = await fetch(`${this.baseURL}/keys`);

    if (!response.ok) {
      throw new Error(`Failed to get API keys: ${response.status}`);
    }

    return response.json();
  }

  async setApiKey(provider, key) {
    const response = await fetch(`${this.baseURL}/keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, key }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `Failed to set API key: ${response.status}`
      );
    }

    return response.json();
  }

  async deleteApiKey(provider) {
    const response = await fetch(`${this.baseURL}/keys/${provider}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `Failed to delete API key: ${response.status}`
      );
    }

    return response.json();
  }
}

class SettingsUI {
  constructor(api) {
    this.api = api;
    this.providers = [];
    this.providerNames = {};
  }

  async init() {
    await this.loadProviderMetadata();
    await this.loadApiKeys();
  }

  async loadProviderMetadata() {
    try {
      const response = await fetch("/api/providers");
      if (!response.ok) {
        throw new Error(`Failed to load provider metadata: ${response.status}`);
      }

      const providersData = await response.json();

      // Extract provider IDs and names
      this.providers = providersData.providers.map((p) => p.id);
      this.providerNames = {};
      providersData.providers.forEach((p) => {
        this.providerNames[p.id] = p.name;
      });
    } catch (error) {
      console.error("Failed to load provider metadata:", error);
      showError(
        "Failed to load provider information. Please refresh the page."
      );
    }
  }

  async loadApiKeys() {
    try {
      const keys = await this.api.getApiKeys();
      const container = document.getElementById("api-keys-container");

      container.innerHTML = "";

      for (const provider of this.providers) {
        const keyStatus = keys[provider];
        const item = this.createApiKeyItem(provider, keyStatus);
        container.appendChild(item);
      }
    } catch (error) {
      console.error("Failed to load API keys:", error);
      showError("Failed to load API keys. Please refresh the page.");
    }
  }

  createApiKeyItem(provider, keyStatus) {
    const div = document.createElement("div");
    div.className = "api-key-item";

    const displayValue = keyStatus.configured ? keyStatus.maskedKey : "";
    const statusClass = keyStatus.configured ? "configured" : "";
    const statusText = keyStatus.configured ? "Configured" : "Not configured";

    div.innerHTML = `
      <div class="api-key-header">
        <h3>${this.providerNames[provider]}</h3>
        <div class="api-key-status">
          <span class="status-indicator ${statusClass}"></span>
          <span>${statusText}</span>
        </div>
      </div>
      <div class="api-key-input-group">
        <input
          type="text"
          class="api-key-input"
          placeholder="Enter API key"
          value="${displayValue}"
          data-provider="${provider}"
          ${keyStatus.configured ? "disabled" : ""}
        />
        ${
          keyStatus.configured
            ? `
          <button class="btn btn-danger" data-provider="${provider}" data-action="delete">
            Delete
          </button>
        `
            : `
          <button class="btn btn-primary" data-provider="${provider}" data-action="save">
            Save
          </button>
        `
        }
      </div>
      <div id="validation-${provider}" class="validation-status"></div>
    `;

    // Add event listeners
    const input = div.querySelector(".api-key-input");
    const saveBtn = div.querySelector('[data-action="save"]');
    const deleteBtn = div.querySelector('[data-action="delete"]');

    // Clear validation message when user types
    if (input && !keyStatus.configured) {
      input.addEventListener("input", () =>
        this.clearValidationStatus(provider)
      );
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", () => this.saveApiKey(provider));
    }
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => this.deleteApiKey(provider));
    }

    return div;
  }

  async saveApiKey(provider) {
    const input = document.querySelector(`input[data-provider="${provider}"]`);
    const key = input.value.trim();

    if (!key) {
      this.showValidationStatus(provider, "invalid", "API key is required");
      return;
    }

    // Clear any previous validation message
    this.clearValidationStatus(provider);
    this.showValidationStatus(provider, "validating", "Validating...");

    try {
      const result = await this.api.setApiKey(provider, key);

      if (result.valid) {
        this.showValidationStatus(provider, "valid", "✓ Valid");
        showSuccess(
          `${this.providerNames[provider]} API key saved successfully`
        );
        // Reduced delay for better UX
        setTimeout(() => this.loadApiKeys(), 800);
      } else {
        this.showValidationStatus(provider, "invalid", `✗ ${result.message}`);
      }
    } catch (error) {
      console.error("Failed to save API key:", error);
      this.showValidationStatus(provider, "invalid", `✗ ${error.message}`);
    }
  }

  async deleteApiKey(provider) {
    if (!confirm(`Delete ${this.providerNames[provider]} API key?`)) {
      return;
    }

    try {
      await this.api.deleteApiKey(provider);
      showSuccess(`${this.providerNames[provider]} API key deleted`);
      await this.loadApiKeys();
    } catch (error) {
      console.error("Failed to delete API key:", error);
      showError(`Failed to delete API key: ${error.message}`);
    }
  }

  clearValidationStatus(provider) {
    const statusDiv = document.getElementById(`validation-${provider}`);
    if (statusDiv) {
      statusDiv.className = "validation-status";
      statusDiv.textContent = "";
    }
  }

  showValidationStatus(provider, status, message) {
    const statusDiv = document.getElementById(`validation-${provider}`);
    if (!statusDiv) return;

    statusDiv.className = `validation-status ${status}`;

    if (status === "validating") {
      statusDiv.innerHTML = `<span class="spinner"></span> ${message}`;
    } else {
      statusDiv.textContent = message;
    }
  }
}

// Initialize
const settingsAPI = new SettingsAPI();
const settingsUI = new SettingsUI(settingsAPI);
settingsUI.init();
