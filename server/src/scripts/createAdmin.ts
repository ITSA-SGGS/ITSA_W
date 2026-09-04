/**
 * ITSA Platform - Admin User Bootstrap Script
 *
 * Secure CLI script to bootstrap an administrative account into Neon PostgreSQL.
 * Passwords are automatically hashed using Argon2id before insertion.
 * Plaintext passwords are NEVER stored, seeded, or committed.
 *
 * Usage:
 *   Option 1: Environment Variables
 *     BOOTSTRAP_ADMIN_EMAIL=admin@sggs.ac.in \
 *     BOOTSTRAP_ADMIN_PASSWORD=YourStrongPassword123! \
 *     BOOTSTRAP_ADMIN_ROLE=SUPER_ADMIN \
 *     BOOTSTRAP_ADMIN_NAME="System Admin" \
 *     npm run admin:bootstrap
 *
 *   Option 2: CLI Arguments
 *     npm run admin:bootstrap -- --email=admin@sggs.ac.in --password=Secret123! --role=SUPER_ADMIN
 *
 *   Option 3: Interactive Prompt
 *     npm run admin:bootstrap
 */

import readline from 'readline';
import { z } from 'zod';
import { adminUserRepository } from '../repositories/adminUser.repository.js';
import { authService } from '../services/auth.service.js';
import { closePool, isDatabaseConfigured } from '../config/database.js';
import { AdminRole } from '../types/database.js';
import { logger } from '../utils/logger.js';

const inputSchema = z.object({
  email: z.string().trim().email('Invalid email address format'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR']).default('SUPER_ADMIN'),
  name: z.string().trim().min(1, 'Name cannot be empty').default('ITSA Administrator'),
});

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [key, ...rest] = arg.slice(2).split('=');
      args[key] = rest.join('=');
    }
  }
  return args;
}

function prompt(question: string, isSecret = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    if (isSecret && process.stdin.isTTY) {
      // Mask password input in terminal
      process.stdout.write(question);
      let pass = '';
      process.stdin.setRawMode?.(true);
      process.stdin.resume();
      process.stdin.on('data', function onData(char) {
        const s = char.toString();
        if (s === '\n' || s === '\r' || s === '\u0004') {
          process.stdin.setRawMode?.(false);
          process.stdin.removeListener('data', onData);
          process.stdout.write('\n');
          rl.close();
          resolve(pass.trim());
        } else if (s === '\u0003') {
          // Ctrl+C
          process.exit(1);
        } else if (s === '\b' || s === '\x7f') {
          if (pass.length > 0) {
            pass = pass.slice(0, -1);
          }
        } else {
          pass += s;
        }
      });
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

export async function bootstrapAdmin(params?: {
  email?: string;
  password?: string;
  role?: string;
  name?: string;
}): Promise<{ id: string; email: string; role: AdminRole }> {
  if (!isDatabaseConfigured) {
    throw new Error('Database is not configured (DATABASE_URL is missing or empty).');
  }

  const cliArgs = parseArgs();

  const isNonInteractive =
    Boolean(params?.email || process.env.BOOTSTRAP_ADMIN_EMAIL || cliArgs.email) ||
    Boolean(params?.password || process.env.BOOTSTRAP_ADMIN_PASSWORD || cliArgs.password);

  const email =
    params?.email ||
    process.env.BOOTSTRAP_ADMIN_EMAIL ||
    cliArgs.email ||
    (await prompt('Admin Email: '));

  const password =
    params?.password ||
    process.env.BOOTSTRAP_ADMIN_PASSWORD ||
    cliArgs.password ||
    (await prompt('Admin Password (min 8 chars): ', true));

  const role =
    params?.role ||
    process.env.BOOTSTRAP_ADMIN_ROLE ||
    cliArgs.role ||
    (isNonInteractive
      ? 'SUPER_ADMIN'
      : (await prompt('Admin Role [SUPER_ADMIN | ADMIN | EDITOR] (default: SUPER_ADMIN): ')) || 'SUPER_ADMIN');

  const name =
    params?.name ||
    process.env.BOOTSTRAP_ADMIN_NAME ||
    cliArgs.name ||
    (isNonInteractive
      ? 'ITSA Administrator'
      : (await prompt('Full Name (default: ITSA Administrator): ')) || 'ITSA Administrator');

  // Validate inputs
  const validation = inputSchema.safeParse({ email, password, role, name });
  if (!validation.success) {
    const errorMsg = validation.error.issues.map((i) => ` - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Validation failed:\n${errorMsg}`);
  }

  const valid = validation.data;

  // Check if admin with this email already exists
  const existing = await adminUserRepository.findByEmail(valid.email);
  if (existing) {
    throw new Error(`User with email "${valid.email}" already exists in Neon database.`);
  }

  // Hash password using Argon2id
  logger.info(`Hashing password using Argon2id for ${valid.email}...`);
  const passwordHash = await authService.hashPassword(valid.password);

  // Insert admin user
  logger.info(`Creating admin user in Neon PostgreSQL...`);
  const user = await adminUserRepository.create({
    email: valid.email,
    passwordHash,
    fullName: valid.name,
    role: valid.role as AdminRole,
    isActive: true,
  });

  logger.info('Admin user created successfully!');
  logger.info(`ID:        ${user.id}`);
  logger.info(`Email:     ${user.email}`);
  logger.info(`Role:      ${user.role}`);
  logger.info(`Full Name: ${user.full_name}`);

  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}

// Run CLI directly
if (process.argv[1]?.endsWith('createAdmin.ts') || process.argv[1]?.endsWith('createAdmin.js')) {
  bootstrapAdmin()
    .then(async () => {
      await closePool();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error('Admin bootstrap failed:', err.message);
      await closePool();
      process.exit(1);
    });
}
