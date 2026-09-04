import { query } from '../config/database.js';
import { AdminSessionRow, SafeAdminUser } from '../types/database.js';

export interface ActiveSessionWithUser {
  session: AdminSessionRow;
  user: SafeAdminUser;
}

export class SessionRepository {
  /**
   * Insert a new session record into admin_sessions.
   */
  public async createSession(data: {
    tokenHash: string;
    userId: string;
    expiresAt: Date;
    userAgent?: string | null;
    ipAddress?: string | null;
  }): Promise<AdminSessionRow> {
    const text = `
      INSERT INTO admin_sessions (token_hash, user_id, expires_at, user_agent, ip_address)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, token_hash, user_id, expires_at, created_at, user_agent, ip_address
    `;
    const params = [
      data.tokenHash,
      data.userId,
      data.expiresAt,
      data.userAgent || null,
      data.ipAddress || null,
    ];

    const result = await query<AdminSessionRow>(text, params);
    return result.rows[0];
  }

  /**
   * Find an active, non-expired session by its SHA-256 token hash,
   * joining the corresponding active admin user profile.
   */
  public async findActiveSession(tokenHash: string): Promise<ActiveSessionWithUser | null> {
    const text = `
      SELECT
        s.id as session_id,
        s.token_hash,
        s.user_id,
        s.expires_at,
        s.created_at as session_created_at,
        s.user_agent,
        s.ip_address,
        u.id as user_id,
        u.email,
        u.full_name,
        u.role,
        u.is_active,
        u.created_at as user_created_at,
        u.updated_at as user_updated_at,
        u.last_login_at
      FROM admin_sessions s
      INNER JOIN admin_users u ON s.user_id = u.id
      WHERE s.token_hash = $1
        AND s.expires_at > now()
        AND u.is_active = true
      LIMIT 1
    `;

    const result = await query<any>(text, [tokenHash]);
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    const session: AdminSessionRow = {
      id: row.session_id,
      token_hash: row.token_hash,
      user_id: row.user_id,
      expires_at: row.expires_at,
      created_at: row.session_created_at,
      user_agent: row.user_agent,
      ip_address: row.ip_address,
    };

    const user: SafeAdminUser = {
      id: row.user_id,
      email: row.email,
      full_name: row.full_name,
      role: row.role,
      is_active: row.is_active,
      created_at: row.user_created_at,
      updated_at: row.user_updated_at,
      last_login_at: row.last_login_at,
    };

    return { session, user };
  }

  /**
   * Delete a session by its token hash (e.g. on logout).
   */
  public async deleteSession(tokenHash: string): Promise<void> {
    const text = `
      DELETE FROM admin_sessions
      WHERE token_hash = $1
    `;
    await query(text, [tokenHash]);
  }

  /**
   * Invalidate all active sessions for a specific user (e.g. password change, deactivation).
   */
  public async deleteUserSessions(userId: string): Promise<void> {
    const text = `
      DELETE FROM admin_sessions
      WHERE user_id = $1
    `;
    await query(text, [userId]);
  }

  /**
   * Periodic purge of expired sessions.
   */
  public async deleteExpiredSessions(): Promise<number> {
    const text = `
      DELETE FROM admin_sessions
      WHERE expires_at <= now()
    `;
    const result = await query(text);
    return result.rowCount;
  }
}

export const sessionRepository = new SessionRepository();
