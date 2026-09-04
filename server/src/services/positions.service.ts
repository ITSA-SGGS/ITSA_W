import {
  positionsRepository,
  PublicPositionsFilter,
  AdminPositionsFilter,
} from '../repositories/positions.repository.js';
import { teamRepository } from '../repositories/team.repository.js';
import { PositionRow, CommitteeTier } from '../types/database.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

export class PositionsService {
  public async getPublicPositions(filters: PublicPositionsFilter = {}): Promise<PositionRow[]> {
    return positionsRepository.findPublic(filters);
  }

  public async getAdminPositions(filters: AdminPositionsFilter = {}): Promise<PositionRow[]> {
    return positionsRepository.findAllAdmin(filters);
  }

  public async getPositionById(id: string): Promise<PositionRow> {
    const position = await positionsRepository.findById(id);
    if (!position) {
      throw new NotFoundError(`Position with ID "${id}" not found.`);
    }
    return position;
  }

  public async createPosition(data: {
    name: string;
    tier: CommitteeTier;
    domain?: string;
    description?: string | null;
    display_order?: number;
    is_active?: boolean;
  }): Promise<PositionRow> {
    // Check for duplicate title in same tier
    const duplicate = await positionsRepository.findByNameAndTier(data.name, data.tier);
    if (duplicate && duplicate.is_active) {
      throw new ConflictError(
        `An active position titled "${data.name}" already exists in the "${data.tier}" tier.`
      );
    }
    return positionsRepository.create(data);
  }

  public async updatePosition(
    id: string,
    data: Partial<PositionRow>
  ): Promise<PositionRow> {
    const existing = await positionsRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Position with ID "${id}" not found.`);
    }

    if (data.name && data.tier) {
      const duplicate = await positionsRepository.findByNameAndTier(data.name, data.tier, id);
      if (duplicate && duplicate.is_active) {
        throw new ConflictError(
          `An active position titled "${data.name}" already exists in the "${data.tier}" tier.`
        );
      }
    }

    const updated = await positionsRepository.update(id, data);
    return updated!;
  }

  public async toggleActive(id: string, isActive?: boolean): Promise<PositionRow> {
    const existing = await positionsRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Position with ID "${id}" not found.`);
    }
    const updated = await positionsRepository.toggleActive(id, isActive);
    return updated!;
  }

  /**
   * Safe position deletion.
   * Checks if position is currently assigned to any committee members.
   * Throws 409 Conflict if in use.
   */
  public async deletePosition(id: string): Promise<void> {
    const position = await positionsRepository.findById(id);
    if (!position) {
      throw new NotFoundError(`Position with ID "${id}" not found.`);
    }

    const memberCount = await teamRepository.countByPositionName(position.name);
    if (memberCount > 0) {
      throw new ConflictError(
        `Cannot delete position "${position.name}" because it is currently assigned to ${memberCount} committee member(s). Deactivate the position instead to preserve data integrity.`
      );
    }

    await positionsRepository.delete(id);
  }
}

export const positionsService = new PositionsService();
