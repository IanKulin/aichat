// controllers/ProviderController.ts - Provider endpoint controller

import { type Request, type Response } from "express";
import { ProviderService } from "../services/ProviderService.ts";

export abstract class ProviderController {
  abstract getProviders(req: Request, res: Response): void;
}

export class DefaultProviderController extends ProviderController {
  private providerService: ProviderService;

  constructor(providerService: ProviderService) {
    super();
    this.providerService = providerService;
  }

  getProviders(req: Request, res: Response): void {
    const providersData = this.providerService.getProviderInfo();
    const availableProviders = this.providerService.getAvailableProviders();

    res.json({
      providers: providersData,
      default: availableProviders.length > 0 ? availableProviders[0] : null,
    });
  }
}