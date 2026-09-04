import { query } from '../config/database.js';
import { AnnouncementRow } from '../types/database.js';

export interface AdminAnnouncementsFilter {
  is_published?: boolean;
  limit?: number;
  offset?: number;
}

export class AnnouncementsRepository {
  /**
   * Public retrieval: strictly active, published announcements within their valid time window.
   */
  public async findActivePublic(): Promise<AnnouncementRow[]> {
    const sql = `
      SELECT id, title, message, link_url, is_published, published_at, expires_at,
             display_order, created_at, updated_at
      FROM announcements
      WHERE is_published = true
        AND (published_at IS NULL OR published_at <= now())
        AND (expires_at IS NULL OR expires_at >= now())
      ORDER BY display_order ASC, created_at DESC
    `;

    const result = await query<AnnouncementRow>(sql);
    return result.rows;
  }

  /**
   * Admin retrieval: all announcements with optional publication filter and pagination.
   */
  public async findAllAdmin(filters: AdminAnnouncementsFilter = {}): Promise<AnnouncementRow[]> {
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
      SELECT id, title, message, link_url, is_published, published_at, expires_at,
             display_order, created_at, updated_at
      FROM announcements
      WHERE ${conditions.join(' AND ')}
      ORDER BY display_order ASC, created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const result = await query<AnnouncementRow>(sql, params);
    return result.rows;
  }

  /**
   * Find single announcement by ID.
   */
  public async findById(id: string): Promise<AnnouncementRow | null> {
    const sql = `
      SELECT id, title, message, link_url, is_published, published_at, expires_at,
             display_order, created_at, updated_at
      FROM announcements
      WHERE id = $1
      LIMIT 1
    `;
    const result = await query<AnnouncementRow>(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Create a new announcement.
   */
  public async create(data: {
    title: string;
    message?: string | null;
    link_url?: string | null;
    is_published?: boolean;
    published_at?: string | null;
    expires_at?: string | null;
    display_order?: number;
  }): Promise<AnnouncementRow> {
    const sql = `
      INSERT INTO announcements (
        title, message, link_url, is_published, published_at, expires_at, display_order
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const params = [
      data.title,
      data.message ?? null,
      data.link_url ?? null,
      data.is_published ?? false,
      data.published_at ?? null,
      data.expires_at ?? null,
      data.display_order ?? 0,
    ];

    const result = await query<AnnouncementRow>(sql, params);
    return result.rows[0];
  }

  /**
   * Update an existing announcement.
   */
  public async update(
    id: string,
    data: Partial<AnnouncementRow>
  ): Promise<AnnouncementRow | null> {
    const fields: string[] = [];
    const params: any[] = [];

    const allowedKeys: (keyof AnnouncementRow)[] = [
      'title',
      'message',
      'link_url',
      'is_published',
      'published_at',
      'expires_at',
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
      UPDATE announcements
      SET ${fields.join(', ')}
      WHERE id = $${params.length}
      RETURNING *
    `;

    const result = await query<AnnouncementRow>(sql, params);
    return result.rows[0] || null;
  }

  /**
   * Toggle publication status.
   */
  public async togglePublish(id: string, isPublished?: boolean): Promise<AnnouncementRow | null> {
    const sql =
      isPublished !== undefined
        ? `UPDATE announcements SET is_published = $1 WHERE id = $2 RETURNING *`
        : `UPDATE announcements SET is_published = NOT is_published WHERE id = $1 RETURNING *`;
    const params = isPublished !== undefined ? [isPublished, id] : [id];

    const result = await query<AnnouncementRow>(sql, params);
    return result.rows[0] || null;
  }

  /**
   * Delete an announcement.
   */
  public async delete(id: string): Promise<boolean> {
    const sql = `DELETE FROM announcements WHERE id = $1`;
    const result = await query(sql, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}

export const announcementsRepository = new AnnouncementsRepository();
