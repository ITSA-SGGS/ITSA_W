import { Request, Response } from 'express';
import { env } from '../config/env.js';
import { isDatabaseConfigured, testConnection } from '../config/database.js';
import { HealthResponse, DatabaseHealthResponse } from '../types/index.js';

export const healthController = {
  /**
   * Basic server health check endpoint (GET /api/health)
   */
  getHealth: (_req: Request, res: Response<HealthResponse>): void => {
    res.status(200).json({
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  },

  /**
   * Database connectivity health check endpoint (GET /api/health/db)
   */
  getDatabaseHealth: async (_req: Request, res: Response<DatabaseHealthResponse>): Promise<void> => {
    const timestamp = new Date().toISOString();

    if (!isDatabaseConfigured) {
      res.status(503).json({
        status: 'unconfigured',
        database: 'unconfigured',
        message: 'Database connection string (DATABASE_URL) is not configured in backend environment.',
        timestamp,
      });
      return;
    }

    const { ok, latencyMs } = await testConnection();

    if (ok) {
      res.status(200).json({
        status: 'ok',
        database: 'connected',
        latencyMs,
        timestamp,
      });
    } else {
      res.status(503).json({
        status: 'error',
        database: 'disconnected',
        message: 'Neon database connectivity check failed.',
        timestamp,
      });
    }
  },
};
