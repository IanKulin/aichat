// controllers/SettingsController.ts - Settings endpoint controller

import { type Request, type Response } from "express";
import type { SettingsService } from "../types/services.ts";
import type { SupportedProvider } from "../types/index.ts";
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

    const validation = await this.settingsService.setApiKey(
      provider as SupportedProvider,
      key
    );
    res.json(validation);
  }

  async deleteApiKey(req: Request, res: Response): Promise<void> {
    const { provider } = req.params;

    await this.settingsService.deleteApiKey(provider as SupportedProvider);
    res.json({ success: true });
  }
}
