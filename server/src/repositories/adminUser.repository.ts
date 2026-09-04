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

  /**
   * List all admin users as SafeAdminUser objects (ordered by created_at ASC).
   * Never exposes password_hash.
   */
  public async findAllSafe(): Promise<SafeAdminUser[]> {
    const text = `
      SELECT id, email, full_name, role, is_active, created_at, updated_at, last_login_at
      FROM admin_users
      ORDER BY created_at ASC
    `;
    const result = await query<SafeAdminUser>(text);
    return result.rows;
  }

  /**
   * Update an existing admin user's role, full_name, or active status.
   */
  public async update(
    id: string,
    data: { fullName?: string | null; role?: AdminRole; isActive?: boolean }
  ): Promise<SafeAdminUser | null> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.fullName !== undefined) {
      params.push(data.fullName);
      fields.push(`full_name = $${params.length}`);
    }

    if (data.role !== undefined) {
      params.push(data.role);
      fields.push(`role = $${params.length}`);
    }

    if (data.isActive !== undefined) {
      params.push(data.isActive);
      fields.push(`is_active = $${params.length}`);
    }

    if (fields.length === 0) {
      return this.findSafeById(id);
    }

    params.push(id);
    const text = `
      UPDATE admin_users
      SET ${fields.join(', ')}
      WHERE id = $${params.length}
      RETURNING id, email, full_name, role, is_active, created_at, updated_at, last_login_at
    `;

    const result = await query<SafeAdminUser>(text, params);
    return result.rows[0] || null;
  }

  /**
   * Toggle or set an admin user's active status.
   */
  public async toggleActive(id: string, isActive?: boolean): Promise<SafeAdminUser | null> {
    const text =
      isActive !== undefined
        ? `UPDATE admin_users SET is_active = $1 WHERE id = $2 RETURNING id, email, full_name, role, is_active, created_at, updated_at, last_login_at`
        : `UPDATE admin_users SET is_active = NOT is_active WHERE id = $1 RETURNING id, email, full_name, role, is_active, created_at, updated_at, last_login_at`;
    const params = isActive !== undefined ? [isActive, id] : [id];

    const result = await query<SafeAdminUser>(text, params);
    return result.rows[0] || null;
  }

  /**
   * Delete an admin user.
   */
  public async delete(id: string): Promise<boolean> {
    const text = `DELETE FROM admin_users WHERE id = $1`;
    const result = await query(text, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}

export const adminUserRepository = new AdminUserRepository();
