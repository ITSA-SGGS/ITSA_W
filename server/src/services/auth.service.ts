import crypto from 'crypto';
import argon2 from 'argon2';
import { adminUserRepository } from '../repositories/adminUser.repository.js';
import { sessionRepository, ActiveSessionWithUser } from '../repositories/session.repository.js';
import { SafeAdminUser, AdminRole } from '../types/database.js';
import { UnauthorizedError } from '../utils/errors.js';
import { SESSION_TTL_MS } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Pre-computed dummy Argon2id hash for constant-time mitigation when email does not exist
const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$dHVtbXlzYWx0MTIzNDU2Nzg$bXlzdGVyaW91c2R1bW15aGFzaGZvcmNvbnN0YW50dGltZQ';

export class AuthService {
  /**
   * Hashes a plaintext password using Argon2id with OWASP-recommended parameters.
   */
  public async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,       // 3 iterations
      parallelism: 4,    // 4 threads
    });
  }

  /**
   * Securely verifies a plaintext password against a stored password hash.
   */
  public async verifyPassword(hash: string, plaintext: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plaintext);
    } catch (err) {
      logger.error('Error during password hash verification');
      return false;
    }
  }

  /**
   * Computes deterministic SHA-256 hash of a session token for secure database lookup.
   */
  public hashSessionToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generates a cryptographically strong 32-byte session token (URL-safe string).
   */
  public generateSessionToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Authenticates an admin user with email and password.
   * On success, sets last_login_at, records a new database session, and returns raw token and safe user profile.
   * Protects against user enumeration and timing attacks.
   */
  public async login(
    email: string,
    password: string,
    metadata?: { userAgent?: string; ipAddress?: string }
  ): Promise<{ rawToken: string; user: SafeAdminUser; expiresAt: Date }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await adminUserRepository.findByEmail(normalizedEmail);

    if (!user || !user.is_active) {
      // Execute constant-time dummy verification to resist timing attacks
      await this.verifyPassword(DUMMY_HASH, password);
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await this.verifyPassword(user.password_hash, password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last_login_at
    await adminUserRepository.updateLastLogin(user.id);

    // Asynchronously delete expired sessions
    sessionRepository.deleteExpiredSessions().catch((err) => {
      logger.warn('Non-blocking cleanup of expired sessions failed:', err.message);
    });

    // Generate secure session
    const rawToken = this.generateSessionToken();
    const tokenHash = this.hashSessionToken(rawToken);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await sessionRepository.createSession({
      tokenHash,
      userId: user.id,
      expiresAt,
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
    });

    const safeUser = adminUserRepository.toSafeUser(user);
    safeUser.last_login_at = new Date();

    return {
      rawToken,
      user: safeUser,
      expiresAt,
    };
  }

  /**
   * Verifies an active session token.
   * Returns session record and active safe user profile, or null if invalid or expired.
   */
  public async verifySession(rawToken: string): Promise<ActiveSessionWithUser | null> {
    if (!rawToken || typeof rawToken !== 'string' || rawToken.trim() === '') {
      return null;
    }

    const tokenHash = this.hashSessionToken(rawToken);
    const active = await sessionRepository.findActiveSession(tokenHash);

    if (!active) {
      return null;
    }

    return active;
  }

  /**
   * Invalidates a session by deleting it from the database.
   */
  public async logout(rawToken: string): Promise<void> {
    if (!rawToken || typeof rawToken !== 'string') {
      return;
    }

    const tokenHash = this.hashSessionToken(rawToken);
    await sessionRepository.deleteSession(tokenHash);
  }
}

export const authService = new AuthService();
