// controllers/SettingsController.ts - Settings endpoint controller

import { type Request, type Response } from "express";
import type { SettingsService } from "../types/services.ts";
import { isValidProvider } from "../lib/provider-constants.ts";
import { SettingsController } from "../types/controllers.ts";

export { SettingsController };

export class DefaultSettingsController extends SettingsController {
  private settingsService: SettingsService;

  constructor(settingsService: SettingsService) {
    super();
    this.settingsService = settingsService;
  }

  async getApiKeys(req: Request, res: Response): Promise<void> {
    const keys = await this.settingsService.getApiKeys();
    res.json(keys);
  }

  async setApiKey(req: Request, res: Response): Promise<void> {
    const { provider, key } = req.body;

    if (!provider || !key) {
      res.status(400).json({ error: "Provider and key are required" });
      return;
    }

    // Validate provider is supported
    if (!isValidProvider(provider)) {
      res.status(400).json({
        error: "Invalid provider",
      });
      return;
    }

    const validation = await this.settingsService.setApiKey(provider, key);
    res.json(validation);
  }

  async deleteApiKey(req: Request, res: Response): Promise<void> {
    const { provider } = req.params;

    // Validate provider is supported
    if (!isValidProvider(provider)) {
      res.status(400).json({
        error: "Invalid provider",
      });
      return;
    }

    await this.settingsService.deleteApiKey(provider);
    res.json({ success: true });
  }
}
