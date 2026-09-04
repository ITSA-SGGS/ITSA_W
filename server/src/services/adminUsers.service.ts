import { adminUserRepository } from '../repositories/adminUser.repository.js';
import { authService } from './auth.service.js';
import { SafeAdminUser, AdminRole } from '../types/database.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

export class AdminUsersService {
  /**
   * List all admin profiles without exposing password hashes.
   */
  public async listUsers(): Promise<SafeAdminUser[]> {
    return adminUserRepository.findAllSafe();
  }

  /**
   * Get single user by ID.
   */
  public async getUserById(id: string): Promise<SafeAdminUser> {
    const user = await adminUserRepository.findSafeById(id);
    if (!user) {
      throw new NotFoundError(`Admin user with ID "${id}" not found.`);
    }
    return user;
  }

  /**
   * Invite / create a new administrator account.
   * Securely hashes password with Argon2id.
   */
  public async inviteUser(data: {
    email: string;
    password: string;
    fullName?: string | null;
    role?: AdminRole;
    isActive?: boolean;
  }): Promise<SafeAdminUser> {
    const existing = await adminUserRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError(`An administrator account with email "${data.email}" already exists.`);
    }

    const passwordHash = await authService.hashPassword(data.password);

    return adminUserRepository.create({
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      role: data.role,
      isActive: data.isActive,
    });
  }

  /**
   * Update administrator details, role, or active status.
   * Safeguards the last active SUPER_ADMIN from demotion or deactivation.
   */
  public async updateUser(
    id: string,
    data: {
      fullName?: string | null;
      full_name?: string | null;
      role?: AdminRole;
      isActive?: boolean;
      is_active?: boolean;
    }
  ): Promise<SafeAdminUser> {
    const existing = await adminUserRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Admin user with ID "${id}" not found.`);
    }

    const isActiveVal = data.is_active !== undefined ? data.is_active : data.isActive;
    const fullNameVal = data.full_name !== undefined ? data.full_name : data.fullName;

    if (existing.role === 'SUPER_ADMIN') {
      const willBeDemoted = data.role !== undefined && data.role !== 'SUPER_ADMIN';
      const willBeDeactivated = isActiveVal === false;

      if (willBeDemoted || willBeDeactivated) {
        const activeCount = await adminUserRepository.countActiveSuperAdmins();
        if (activeCount <= 1) {
          throw new ConflictError(
            'Cannot deactivate or demote the only remaining active SUPER_ADMIN account.'
          );
        }
      }
    }

    const updated = await adminUserRepository.update(id, {
      fullName: fullNameVal,
      role: data.role,
      isActive: isActiveVal,
    });

    return updated!;
  }

  /**
   * Toggle or set an administrator's active status.
   * Safeguards the last active SUPER_ADMIN.
   */
  public async toggleActive(id: string, isActive?: boolean): Promise<SafeAdminUser> {
    const existing = await adminUserRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Admin user with ID "${id}" not found.`);
    }

    const nextState = isActive !== undefined ? isActive : !existing.is_active;

    if (existing.role === 'SUPER_ADMIN' && !nextState) {
      const activeCount = await adminUserRepository.countActiveSuperAdmins();
      if (activeCount <= 1) {
        throw new ConflictError(
          'Cannot deactivate the only remaining active SUPER_ADMIN account.'
        );
      }
    }

    const updated = await adminUserRepository.toggleActive(id, isActive);
    return updated!;
  }

  /**
   * Revoke/delete administrator account.
   * Safeguards the last active SUPER_ADMIN.
   */
  public async deleteUser(id: string): Promise<void> {
    const existing = await adminUserRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Admin user with ID "${id}" not found.`);
    }

    if (existing.role === 'SUPER_ADMIN') {
      const activeCount = await adminUserRepository.countActiveSuperAdmins();
      if (activeCount <= 1) {
        throw new ConflictError(
          'Cannot delete the only remaining active SUPER_ADMIN account.'
        );
      }
    }

    await adminUserRepository.delete(id);
  }
}

export const adminUsersService = new AdminUsersService();
