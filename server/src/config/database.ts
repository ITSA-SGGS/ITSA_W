import pg from 'pg';
import net from 'net';
import { env } from './env.js';
import { logger, formatError } from '../utils/logger.js';

const { Pool } = pg;

export const isDatabaseConfigured = Boolean(
  env.DATABASE_URL &&
  env.DATABASE_URL.trim() !== '' &&
  !env.DATABASE_URL.includes('your-neon-hostname')
);

let poolInstance: pg.Pool | null = null;

/**
 * Socket factory ensuring IPv4 address family resolution.
 * Prevents Node.js Happy Eyeballs (RFC 8305) from attempting unreachable
 * IPv6 routes (ENETUNREACH) on systems without global IPv6 connectivity.
 */
function createIPv4Socket(): net.Socket {
  const socket = new net.Socket();
  const origConnect = socket.connect.bind(socket);
  socket.connect = function (...args: any[]) {
    if (typeof args[0] === 'number') {
      const [port, host, cb] = args;
      return origConnect({ port, host, family: 4 }, cb);
    }
    return origConnect({ ...args[0], family: 4 }, args[1]);
  };
  return socket;
}

export function getPool(): pg.Pool {
  if (!isDatabaseConfigured || !env.DATABASE_URL) {
    throw new Error('Database connection string (DATABASE_URL) is not configured in environment.');
  }

  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      stream: createIPv4Socket as any,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    poolInstance.on('error', (err) => {
      logger.error('Unexpected database client error in pool:\n' + formatError(err));
    });
  }

  return poolInstance;
}

/**
 * Executes a parameterized SQL query against Neon PostgreSQL.
 * NEVER construct SQL queries using string interpolation with user input.
 */
export async function query<T = any>(
  text: string,
  params: any[] = []
): Promise<{ rows: T[]; rowCount: number }> {
  const pool = getPool();
  const start = Date.now();

  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (env.NODE_ENV === 'development') {
      logger.debug(`Executed query in ${duration}ms: ${text.substring(0, 100)}...`);
    }

    return {
      rows: result.rows as T[],
      rowCount: result.rowCount ?? result.rows.length,
    };
  } catch (error: any) {
    const duration = Date.now() - start;
    logger.error(`Database query failed after ${duration}ms:\n` + formatError(error));
    throw error;
  }
}

/**
 * Health check test executing SELECT 1 to verify database connectivity.
 */
export async function testConnection(): Promise<{
  ok: boolean;
  latencyMs?: number;
  error?: string;
}> {
  if (!isDatabaseConfigured) {
    return { ok: false, error: 'DATABASE_URL is not configured.' };
  }

  const start = Date.now();
  try {
    const pool = getPool();
    await pool.query('SELECT 1 AS health_check');
    const latencyMs = Date.now() - start;
    return { ok: true, latencyMs };
  } catch (err: any) {
    return { ok: false, error: formatError(err, false) };
  }
}

/**
 * Gracefully terminates the connection pool.
 */
export async function closePool(): Promise<void> {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
    logger.info('Neon database pool shut down cleanly.');
  }
}
