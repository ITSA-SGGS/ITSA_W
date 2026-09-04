import { metricsRepository } from '../repositories/metrics.repository.js';
import { DashboardMetrics } from '../types/cms.js';

export class MetricsService {
  public async getDashboardMetrics(): Promise<DashboardMetrics> {
    return metricsRepository.getDashboardMetrics();
  }
}

export const metricsService = new MetricsService();
