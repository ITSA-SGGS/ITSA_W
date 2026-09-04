import { Request, Response, NextFunction } from 'express';
import { siteSettingsService } from '../services/siteSettings.service.js';
import { sendSuccess } from '../utils/response.js';

export class SiteSettingsController {
  public async getPublicSettings(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const settings = await siteSettingsService.getPublicSettings();
      sendSuccess(res, settings);
    } catch (error) {
      next(error);
    }
  }

  public async getAllSettings(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const settings = await siteSettingsService.getAllSettings();
      sendSuccess(res, settings);
    } catch (error) {
      next(error);
    }
  }

  public async batchUpdateSettings(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await siteSettingsService.batchUpdateSettings(req.body);
      sendSuccess(res, { message: 'Site settings updated successfully.' });
    } catch (error) {
      next(error);
    }
  }
}

export const siteSettingsController = new SiteSettingsController();
