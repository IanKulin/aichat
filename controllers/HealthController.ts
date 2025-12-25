// controllers/HealthController.ts - Health check endpoint controller

import { type Request, type Response } from "express";
import type { ProviderService } from "../types/services.ts";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { HealthController } from "../types/controllers.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf-8")
);

export { HealthController };

export class DefaultHealthController extends HealthController {
  private providerService: ProviderService;

  constructor(providerService: ProviderService) {
    super();
    this.providerService = providerService;
  }

  checkHealth(req: Request, res: Response): void {
    const providerValidations = this.providerService.validateAllProviders();
    const currentAvailableProviders =
      this.providerService.getAvailableProviders();

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: packageJson.version,
      providers: providerValidations,
      available_providers: currentAvailableProviders,
    });
  }
}
