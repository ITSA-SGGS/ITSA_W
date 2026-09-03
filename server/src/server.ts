import { app } from './app.js';
import { env } from './config/env.js';
import { isDatabaseConfigured, closePool } from './config/database.js';
import { logger } from './utils/logger.js';

const server = app.listen(env.PORT, () => {
  logger.info(`=======================================================`);
  logger.info(`ITSA Platform Backend Service running on port ${env.PORT}`);
  logger.info(`Environment:       ${env.NODE_ENV}`);
  logger.info(`Client Origin:     ${env.CLIENT_ORIGIN}`);
  logger.info(`Database Status:   ${isDatabaseConfigured ? 'Configured (Neon PostgreSQL)' : 'Unconfigured (Pending DATABASE_URL)'}`);
  logger.info(`Health Endpoint:   http://localhost:${env.PORT}/api/health`);
  logger.info(`DB Health Endpoint:http://localhost:${env.PORT}/api/health/db`);
  logger.info(`=======================================================`);
});

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await closePool();
      logger.info('Database pool closed cleanly. Process exiting.');
      process.exit(0);
    } catch (err: any) {
      logger.error('Error during database pool shutdown:', err.message);
      process.exit(1);
    }
  });

  // Force close after 10 seconds if hanging
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
