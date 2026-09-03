import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';
import { getPool, isDatabaseConfigured, closePool } from '../config/database.js';
import { logger, formatError } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

export async function runMigrations(): Promise<void> {
  if (!isDatabaseConfigured) {
    if (!env.DATABASE_URL || env.DATABASE_URL.trim() === '') {
      logger.warn('DATABASE_URL is not set (empty or missing) in server/.env.');
    } else if (env.DATABASE_URL.includes('your-neon-hostname')) {
      logger.warn('DATABASE_URL contains the placeholder template "your-neon-hostname" in server/.env.');
    } else {
      logger.warn('DATABASE_URL is invalid in server/.env.');
    }
    logger.warn('Skipping migration execution against Neon.');
    return;
  }

  logger.info('Initializing Neon migration runner...');
  let pool;
  let client;

  try {
    pool = getPool();
    client = await pool.connect();
  } catch (connErr: any) {
    logger.error('Failed to establish database connection to Neon:\n' + formatError(connErr));
    throw connErr;
  }

  try {
    // 1. Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id serial PRIMARY KEY,
        name text UNIQUE NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // 2. Query already applied migrations
    const { rows: appliedRows } = await client.query<{ name: string }>(
      'SELECT name FROM _migrations ORDER BY id ASC'
    );
    const appliedSet = new Set(appliedRows.map((r) => r.name));

    // 3. Find and sort all .sql migration files
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      logger.warn(`Migrations directory not found: ${MIGRATIONS_DIR}`);
      return;
    }

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let pendingCount = 0;

    for (const file of files) {
      if (appliedSet.has(file)) {
        logger.debug(`Migration already applied: ${file}`);
        continue;
      }

      pendingCount++;
      logger.info(`Applying migration [${pendingCount}]: ${file}...`);
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      // Execute migration inside an atomic transaction
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        logger.info(`Successfully applied migration: ${file}`);
      } catch (err: any) {
        await client.query('ROLLBACK');
        logger.error(`Migration failed on ${file}. Rolled back transaction:\n` + formatError(err));
        throw err;
      }
    }

    if (pendingCount === 0) {
      logger.info('Database schema is already up to date. No pending migrations.');
    } else {
      logger.info(`Successfully applied ${pendingCount} migration(s) to Neon PostgreSQL.`);
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
  runMigrations()
    .then(() => {
      logger.info('Migration process finished.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Fatal migration error:\n' + formatError(err));
      process.exit(1);
    });
}
