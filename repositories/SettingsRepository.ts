// repositories/SettingsRepository.ts - Repository for managing application settings

import type { Database } from "better-sqlite3";
import { getDatabase } from "../lib/database.ts";
import { logger } from "../lib/logger.ts";
import { SUPPORTED_PROVIDERS } from "../lib/provider-metadata.ts";
import type { SupportedProvider } from "../lib/types.ts";

interface SettingRow {
  key: string;
  value: string;
  updated_at: number;
}

export interface ISettingsRepository {
  getApiKey(provider: SupportedProvider): string | null;
  setApiKey(provider: SupportedProvider, key: string): void;
  getAllApiKeys(): Record<SupportedProvider, string | null>;
  deleteApiKey(provider: SupportedProvider): void;
}

export class SettingsRepository implements ISettingsRepository {
  private db: Database;

  constructor() {
    this.db = getDatabase();
  }

  getApiKey(provider: SupportedProvider): string | null {
    const key = `api_key_${provider}`;
    try {
      const stmt = this.db.prepare("SELECT value FROM settings WHERE key = ?");
      const row = stmt.get(key) as SettingRow | undefined;
      return row ? row.value : null;
    } catch (error) {
      logger.error(`Failed to get API key for ${provider}:`, {
        provider,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  setApiKey(provider: SupportedProvider, key: string): void {
    const settingKey = `api_key_${provider}`;
    const now = Date.now();
    try {
      const stmt = this.db.prepare(`
        INSERT INTO settings (key, value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?
      `);
      stmt.run(settingKey, key, now, key, now);
    } catch (error) {
      logger.error(`Failed to save API key for ${provider}:`, {
        provider,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  getAllApiKeys(): Record<SupportedProvider, string | null> {
    const result = {} as Record<SupportedProvider, string | null>;

    SUPPORTED_PROVIDERS.forEach((provider) => {
      result[provider] = this.getApiKey(provider);
    });

    return result;
  }

  deleteApiKey(provider: SupportedProvider): void {
    const key = `api_key_${provider}`;
    try {
      const stmt = this.db.prepare("DELETE FROM settings WHERE key = ?");
      stmt.run(key);
    } catch (error) {
      logger.error(`Failed to delete API key for ${provider}:`, {
        provider,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
