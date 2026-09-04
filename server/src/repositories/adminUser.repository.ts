import { query } from '../config/database.js';
import { AdminUserRow, SafeAdminUser, AdminRole } from '../types/database.js';

export class AdminUserRepository {
  /**
   * Helper to strip password_hash from user row.
   */
  public toSafeUser(user: AdminUserRow): SafeAdminUser {
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Find admin user by email (case-insensitive, trimmed).
   * Note: This returns the full row including password_hash for authentication purposes.
   * NEVER return this row directly to API consumers.
   */
  public async findByEmail(email: string): Promise<AdminUserRow | null> {
    const text = `
      SELECT id, email, password_hash, full_name, role, is_active, created_at, updated_at, last_login_at
      FROM admin_users
      WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))
      LIMIT 1
    `;
    const result = await query<AdminUserRow>(text, [email]);
    return result.rows[0] || null;
  }

  /**
   * Find user by UUID id.
   */
  public async findById(id: string): Promise<AdminUserRow | null> {
    const text = `
      SELECT id, email, password_hash, full_name, role, is_active, created_at, updated_at, last_login_at
      FROM admin_users
      WHERE id = $1
      LIMIT 1
    `;
    const result = await query<AdminUserRow>(text, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find safe user profile by UUID id (without password_hash).
   */
  public async findSafeById(id: string): Promise<SafeAdminUser | null> {
    const text = `
      SELECT id, email, full_name, role, is_active, created_at, updated_at, last_login_at
      FROM admin_users
      WHERE id = $1
      LIMIT 1
    `;
    const result = await query<SafeAdminUser>(text, [id]);
    return result.rows[0] || null;
  }

  /**
   * Insert new admin user with hashed password. Returns safe user without password_hash.
   */
  public async create(data: {
    email: string;
    passwordHash: string;
    fullName?: string | null;
    role?: AdminRole;
    isActive?: boolean;
  }): Promise<SafeAdminUser> {
    const text = `
      INSERT INTO admin_users (email, password_hash, full_name, role, is_active)
      VALUES (LOWER(TRIM($1)), $2, $3, $4, $5)
      RETURNING id, email, full_name, role, is_active, created_at, updated_at, last_login_at
    `;
    const params = [
      data.email,
      data.passwordHash,
      data.fullName || null,
      data.role || 'ADMIN',
      data.isActive ?? true,
    ];

    const result = await query<SafeAdminUser>(text, params);
    return result.rows[0];
  }

  /**
   * Update last_login_at timestamp for user.
   */
  public async updateLastLogin(userId: string): Promise<void> {
    const text = `
      UPDATE admin_users
      SET last_login_at = now()
      WHERE id = $1
    `;
    await query(text, [userId]);
  }

  /**
   * Count active super administrators (used to safeguard last remaining SUPER_ADMIN).
   */
  public async countActiveSuperAdmins(): Promise<number> {
    const text = `
      SELECT count(*)::int as count
      FROM admin_users
      WHERE role = 'SUPER_ADMIN' AND is_active = true
    `;
    const result = await query<{ count: number }>(text);
    return result.rows[0]?.count || 0;
  }
}

export const adminUserRepository = new AdminUserRepository();
