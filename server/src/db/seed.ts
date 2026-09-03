import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';
import { getPool, isDatabaseConfigured, closePool } from '../config/database.js';
import { logger, formatError } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEED_FILE = path.join(__dirname, 'seed', '001_initial_seed.sql');

export async function runSeed(): Promise<void> {
  if (!isDatabaseConfigured) {
    if (!env.DATABASE_URL || env.DATABASE_URL.trim() === '') {
      logger.warn('DATABASE_URL is not set (empty or missing) in server/.env.');
    } else if (env.DATABASE_URL.includes('your-neon-hostname')) {
      logger.warn('DATABASE_URL contains the placeholder template "your-neon-hostname" in server/.env.');
    } else {
      logger.warn('DATABASE_URL is invalid in server/.env.');
    }
    logger.warn('Skipping seed execution against Neon.');
    return;
  }

  if (!fs.existsSync(SEED_FILE)) {
    logger.error(`Seed SQL file not found at: ${SEED_FILE}`);
    return;
  }

  logger.info('Executing initial seed script against Neon PostgreSQL...');
  let pool;
  let client;

  try {
    pool = getPool();
    client = await pool.connect();
  } catch (connErr: any) {
    logger.error('Failed to establish database connection to Neon for seeding:\n' + formatError(connErr));
    throw connErr;
  }

  try {
    const sql = fs.readFileSync(SEED_FILE, 'utf-8');

    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('COMMIT');
      logger.info('Database seeded successfully with official ITSA baseline data.');
    } catch (err: any) {
      await client.query('ROLLBACK');
      logger.error('Seed execution failed. Rolled back transaction:\n' + formatError(err));
      throw err;
    }
  } finally {
    if (client) {
      client.release();
    }
    await closePool();
  }
}

// Allow direct execution via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeed()
    .then(() => {
      logger.info('Seed process completed.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Fatal seed error:\n' + formatError(err));
      process.exit(1);
    });
}
