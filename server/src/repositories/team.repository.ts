import { query } from '../config/database.js';
import { CommitteeMemberRow, CommitteeTier } from '../types/database.js';

export interface PublicTeamFilter {
  tier?: CommitteeTier;
}

export interface AdminTeamFilter {
  tier?: CommitteeTier;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

export class TeamRepository {
  /**
   * Public retrieval: strictly filters for active committee members only.
   * Selects only public-safe columns (zero student IDs, phone numbers, or private metadata).
   */
  public async findPublic(filters: PublicTeamFilter = {}): Promise<CommitteeMemberRow[]> {
    const conditions: string[] = ['is_active = true'];
    const params: any[] = [];

    if (filters.tier) {
      params.push(filters.tier);
      conditions.push(`tier = $${params.length}`);
    }

    const sql = `
      SELECT id, name, position, tier, domain, department, photo_url, linkedin_url,
             github_url, tenure_year, is_active, display_order, created_at, updated_at
      FROM committee_members
      WHERE ${conditions.join(' AND ')}
      ORDER BY display_order ASC, created_at ASC
    `;

    const result = await query<CommitteeMemberRow>(sql, params);
    return result.rows;
  }

  /**
   * Admin retrieval: includes inactive members with filtering and pagination.
   */
  public async findAllAdmin(filters: AdminTeamFilter = {}): Promise<CommitteeMemberRow[]> {
    const conditions: string[] = ['1=1'];
    const params: any[] = [];

    if (filters.tier) {
      params.push(filters.tier);
      conditions.push(`tier = $${params.length}`);
    }

    if (filters.is_active !== undefined) {
      params.push(filters.is_active);
      conditions.push(`is_active = $${params.length}`);
    }

    const limit = filters.limit ?? 100;
    const offset = filters.offset ?? 0;

    params.push(limit);
    const limitIdx = params.length;

    params.push(offset);
    const offsetIdx = params.length;

    const sql = `
      SELECT id, name, position, tier, domain, department, photo_url, linkedin_url,
             github_url, tenure_year, is_active, display_order, created_at, updated_at
      FROM committee_members
      WHERE ${conditions.join(' AND ')}
      ORDER BY display_order ASC, created_at ASC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const result = await query<CommitteeMemberRow>(sql, params);
    return result.rows;
  }

  /**
   * Find single committee member by ID.
   */
  public async findById(id: string): Promise<CommitteeMemberRow | null> {
    const sql = `
      SELECT id, name, position, tier, domain, department, photo_url, linkedin_url,
             github_url, tenure_year, is_active, display_order, created_at, updated_at
      FROM committee_members
      WHERE id = $1
      LIMIT 1
    `;
    const result = await query<CommitteeMemberRow>(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Create a new committee member.
   */
  public async create(data: {
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
    const sql = `
      INSERT INTO committee_members (
        name, position, tier, domain, department, photo_url, linkedin_url,
        github_url, tenure_year, is_active, display_order
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const params = [
      data.name,
      data.position,
      data.tier,
      data.domain || 'OVERALL',
      data.department || null,
      data.photo_url || null,
      data.linkedin_url || null,
      data.github_url || null,
      data.tenure_year || '2026–2027',
      data.is_active ?? true,
      data.display_order ?? 0,
    ];

    const result = await query<CommitteeMemberRow>(sql, params);
    return result.rows[0];
  }

  /**
   * Update an existing committee member.
   */
  public async update(
    id: string,
    data: Partial<CommitteeMemberRow>
  ): Promise<CommitteeMemberRow | null> {
    const fields: string[] = [];
    const params: any[] = [];

    const allowedKeys: (keyof CommitteeMemberRow)[] = [
      'name',
      'position',
      'tier',
      'domain',
      'department',
      'photo_url',
      'linkedin_url',
      'github_url',
      'tenure_year',
      'is_active',
      'display_order',
    ];

    for (const key of allowedKeys) {
      if (data[key] !== undefined) {
        params.push(data[key]);
        fields.push(`${key} = $${params.length}`);
      }
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    params.push(id);
    const sql = `
      UPDATE committee_members
      SET ${fields.join(', ')}
      WHERE id = $${params.length}
      RETURNING *
    `;

    const result = await query<CommitteeMemberRow>(sql, params);
    return result.rows[0] || null;
  }

  /**
   * Toggle active state.
   */
  public async toggleActive(id: string, isActive?: boolean): Promise<CommitteeMemberRow | null> {
    const sql =
      isActive !== undefined
        ? `UPDATE committee_members SET is_active = $1 WHERE id = $2 RETURNING *`
        : `UPDATE committee_members SET is_active = NOT is_active WHERE id = $1 RETURNING *`;
    const params = isActive !== undefined ? [isActive, id] : [id];

    const result = await query<CommitteeMemberRow>(sql, params);
    return result.rows[0] || null;
  }

  /**
   * Delete a committee member.
   */
  public async delete(id: string): Promise<boolean> {
    const sql = `DELETE FROM committee_members WHERE id = $1`;
    const result = await query(sql, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Check how many committee members are assigned to a position name.
   * Case-insensitive match to guard position deletion.
   */
  public async countByPositionName(positionName: string): Promise<number> {
    const sql = `
      SELECT count(*)::int as count
      FROM committee_members
      WHERE LOWER(TRIM(position)) = LOWER(TRIM($1))
    `;
    const result = await query<{ count: number }>(sql, [positionName]);
    return result.rows[0]?.count || 0;
  }
}

export const teamRepository = new TeamRepository();
