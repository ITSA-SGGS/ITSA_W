import { query } from '../config/database.js';
import { ArchiveRecordRow } from '../types/database.js';

export interface PublicArchiveFilter {
  limit?: number;
  offset?: number;
}

export interface AdminArchiveFilter {
  is_published?: boolean;
  limit?: number;
  offset?: number;
}

export class ArchiveRepository {
  /**
   * Public retrieval: strictly published records only.
   */
  public async findPublic(filters: PublicArchiveFilter = {}): Promise<ArchiveRecordRow[]> {
    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;

    const sql = `
      SELECT id, title, description, image_url, year, event_name, display_order,
             is_published, created_at, updated_at
      FROM archive_records
      WHERE is_published = true
      ORDER BY display_order ASC, created_at ASC
      LIMIT $1 OFFSET $2
    `;

    const result = await query<ArchiveRecordRow>(sql, [limit, offset]);
    return result.rows;
  }

  /**
   * Admin retrieval: includes drafts and unpublished records with pagination.
   */
  public async findAllAdmin(filters: AdminArchiveFilter = {}): Promise<ArchiveRecordRow[]> {
    const conditions: string[] = ['1=1'];
    const params: any[] = [];

    if (filters.is_published !== undefined) {
      params.push(filters.is_published);
      conditions.push(`is_published = $${params.length}`);
    }

    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;

    params.push(limit);
    const limitIdx = params.length;

    params.push(offset);
    const offsetIdx = params.length;

    const sql = `
      SELECT id, title, description, image_url, year, event_name, display_order,
             is_published, created_at, updated_at
      FROM archive_records
      WHERE ${conditions.join(' AND ')}
      ORDER BY display_order ASC, created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const result = await query<ArchiveRecordRow>(sql, params);
    return result.rows;
  }

  /**
   * Find single archive record by ID.
   */
  public async findById(id: string): Promise<ArchiveRecordRow | null> {
    const sql = `
      SELECT id, title, description, image_url, year, event_name, display_order,
             is_published, created_at, updated_at
      FROM archive_records
      WHERE id = $1
      LIMIT 1
    `;
    const result = await query<ArchiveRecordRow>(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Create a new archive record.
   */
  public async create(data: {
    title?: string | null;
    description?: string | null;
    image_url: string;
    year?: number | null;
    event_name?: string | null;
    display_order?: number;
    is_published?: boolean;
  }): Promise<ArchiveRecordRow> {
    const sql = `
      INSERT INTO archive_records (title, description, image_url, year, event_name, display_order, is_published)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const params = [
      data.title ?? null,
      data.description ?? null,
      data.image_url,
      data.year ?? null,
      data.event_name ?? null,
      data.display_order ?? 0,
      data.is_published ?? false,
    ];

    const result = await query<ArchiveRecordRow>(sql, params);
    return result.rows[0];
  }

  /**
   * Update an existing archive record.
   */
  public async update(
    id: string,
    data: Partial<ArchiveRecordRow>
  ): Promise<ArchiveRecordRow | null> {
    const fields: string[] = [];
    const params: any[] = [];

    const allowedKeys: (keyof ArchiveRecordRow)[] = [
      'title',
      'description',
      'image_url',
      'year',
      'event_name',
      'display_order',
      'is_published',
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
      UPDATE archive_records
      SET ${fields.join(', ')}
      WHERE id = $${params.length}
      RETURNING *
    `;

    const result = await query<ArchiveRecordRow>(sql, params);
    return result.rows[0] || null;
  }

  /**
   * Toggle publication status.
   */
  public async togglePublish(id: string, isPublished?: boolean): Promise<ArchiveRecordRow | null> {
    const sql =
      isPublished !== undefined
        ? `UPDATE archive_records SET is_published = $1 WHERE id = $2 RETURNING *`
        : `UPDATE archive_records SET is_published = NOT is_published WHERE id = $1 RETURNING *`;
    const params = isPublished !== undefined ? [isPublished, id] : [id];

    const result = await query<ArchiveRecordRow>(sql, params);
    return result.rows[0] || null;
  }

  /**
   * Delete an archive record.
   */
  public async delete(id: string): Promise<boolean> {
    const sql = `DELETE FROM archive_records WHERE id = $1`;
    const result = await query(sql, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}

export const archiveRepository = new ArchiveRepository();
