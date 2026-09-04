import {
  teamRepository,
  PublicTeamFilter,
  AdminTeamFilter,
} from '../repositories/team.repository.js';
import { CommitteeMemberRow, CommitteeTier } from '../types/database.js';
import { PublicCommitteeMember } from '../types/cms.js';
import { NotFoundError } from '../utils/errors.js';

export class TeamService {
  /**
   * Get public-safe committee members.
   * Explicitly ensures only public-safe fields are returned (no student ID or sensitive data).
   */
  public async getPublicTeam(filters: PublicTeamFilter = {}): Promise<PublicCommitteeMember[]> {
    const rows = await teamRepository.findPublic(filters);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      position: row.position,
      tier: row.tier,
      domain: row.domain,
      department: row.department,
      photo_url: row.photo_url,
      linkedin_url: row.linkedin_url,
      github_url: row.github_url,
      tenure_year: row.tenure_year,
      display_order: row.display_order,
    }));
  }

  public async getAdminTeam(filters: AdminTeamFilter = {}): Promise<CommitteeMemberRow[]> {
    return teamRepository.findAllAdmin(filters);
  }

  public async getMemberById(id: string): Promise<CommitteeMemberRow> {
    const member = await teamRepository.findById(id);
    if (!member) {
      throw new NotFoundError(`Committee member with ID "${id}" not found.`);
    }
    return member;
  }

  public async createMember(data: {
    name: string;
    position: string;
    tier: CommitteeTier;
    domain?: string;
    department?: string | null;
    photo_url?: string | null;
    linkedin_url?: string | null;
    github_url?: string | null;
    tenure_year?: string;
    is_active?: boolean;
    display_order?: number;
  }): Promise<CommitteeMemberRow> {
    return teamRepository.create(data);
  }

  public async updateMember(
    id: string,
    data: Partial<CommitteeMemberRow>
  ): Promise<CommitteeMemberRow> {
    const existing = await teamRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Committee member with ID "${id}" not found.`);
    }
    const updated = await teamRepository.update(id, data);
    return updated!;
  }

  public async toggleActive(id: string, isActive?: boolean): Promise<CommitteeMemberRow> {
    const existing = await teamRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Committee member with ID "${id}" not found.`);
    }
    const updated = await teamRepository.toggleActive(id, isActive);
    return updated!;
  }

  public async deleteMember(id: string): Promise<void> {
    const existing = await teamRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Committee member with ID "${id}" not found.`);
    }
    await teamRepository.delete(id);
  }
}

export const teamService = new TeamService();
