import { Request, Response, NextFunction } from 'express';
import { metricsService } from '../services/metrics.service.js';
import { sendSuccess } from '../utils/response.js';

export class MetricsController {
  public async getDashboardMetrics(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const metrics = await metricsService.getDashboardMetrics();
      sendSuccess(res, metrics);
    } catch (error) {
      next(error);
    }
  }
}

export const metricsController = new MetricsController();
