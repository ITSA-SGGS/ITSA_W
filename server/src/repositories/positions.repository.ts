import { query } from '../config/database.js';
import { PositionRow, CommitteeTier } from '../types/database.js';

export interface PublicPositionsFilter {
  tier?: CommitteeTier;
}

export interface AdminPositionsFilter {
  tier?: CommitteeTier;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

export class PositionsRepository {
  /**
   * Public retrieval: active positions only.
   */
  public async findPublic(filters: PublicPositionsFilter = {}): Promise<PositionRow[]> {
    const conditions: string[] = ['is_active = true'];
    const params: any[] = [];

    if (filters.tier) {
      params.push(filters.tier);
      conditions.push(`tier = $${params.length}`);
    }

    const sql = `
      SELECT id, name, tier, domain, description, display_order, is_active, created_at, updated_at
      FROM positions
      WHERE ${conditions.join(' AND ')}
      ORDER BY display_order ASC, name ASC
    `;

    const result = await query<PositionRow>(sql, params);
    return result.rows;
  }

  /**
   * Admin retrieval: all positions (active + inactive) with filtering and pagination.
   */
  public async findAllAdmin(filters: AdminPositionsFilter = {}): Promise<PositionRow[]> {
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
      SELECT id, name, tier, domain, description, display_order, is_active, created_at, updated_at
      FROM positions
      WHERE ${conditions.join(' AND ')}
      ORDER BY display_order ASC, name ASC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const result = await query<PositionRow>(sql, params);
    return result.rows;
  }

  /**
   * Find single position by ID.
   */
  public async findById(id: string): Promise<PositionRow | null> {
    const sql = `
      SELECT id, name, tier, domain, description, display_order, is_active, created_at, updated_at
      FROM positions
      WHERE id = $1
      LIMIT 1
    `;
    const result = await query<PositionRow>(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find position by name and tier (for duplicate detection).
   */
  public async findByNameAndTier(
    name: string,
    tier: CommitteeTier,
    excludeId?: string
  ): Promise<PositionRow | null> {
    const params: any[] = [name, tier];
    let sql = `
      SELECT id, name, tier, domain, description, display_order, is_active, created_at, updated_at
      FROM positions
      WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) AND tier = $2
    `;

    if (excludeId) {
      params.push(excludeId);
      sql += ` AND id != $3`;
    }

    sql += ` LIMIT 1`;

    const result = await query<PositionRow>(sql, params);
    return result.rows[0] || null;
  }

  /**
   * Create a new position.
   */
  public async create(data: {
    name: string;
    tier: CommitteeTier;
    domain?: string;
    description?: string | null;
    display_order?: number;
    is_active?: boolean;
  }): Promise<PositionRow> {
    const sql = `
      INSERT INTO positions (name, tier, domain, description, display_order, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const params = [
      data.name,
      data.tier,
      data.domain || 'OVERALL',
      data.description ?? null,
      data.display_order ?? 0,
      data.is_active ?? true,
    ];

    const result = await query<PositionRow>(sql, params);
    return result.rows[0];
  }

  /**
   * Update an existing position.
   */
  public async update(id: string, data: Partial<PositionRow>): Promise<PositionRow | null> {
    const fields: string[] = [];
    const params: any[] = [];

    const allowedKeys: (keyof PositionRow)[] = [
      'name',
      'tier',
      'domain',
      'description',
      'display_order',
      'is_active',
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
      UPDATE positions
      SET ${fields.join(', ')}
      WHERE id = $${params.length}
      RETURNING *
    `;

    const result = await query<PositionRow>(sql, params);
    return result.rows[0] || null;
  }

  /**
   * Toggle active state.
   */
  public async toggleActive(id: string, isActive?: boolean): Promise<PositionRow | null> {
    const sql =
      isActive !== undefined
        ? `UPDATE positions SET is_active = $1 WHERE id = $2 RETURNING *`
        : `UPDATE positions SET is_active = NOT is_active WHERE id = $1 RETURNING *`;
    const params = isActive !== undefined ? [isActive, id] : [id];

    const result = await query<PositionRow>(sql, params);
    return result.rows[0] || null;
  }

  /**
   * Delete a position.
   */
  public async delete(id: string): Promise<boolean> {
    const sql = `DELETE FROM positions WHERE id = $1`;
    const result = await query(sql, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}

export const positionsRepository = new PositionsRepository();
