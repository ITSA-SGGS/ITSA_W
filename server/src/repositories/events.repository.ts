import { query } from '../config/database.js';
import { EventRow, EventCategory, EventStatus } from '../types/database.js';

export interface PublicEventsFilter {
  category?: EventCategory;
  limit?: number;
  offset?: number;
}

export interface AdminEventsFilter {
  category?: EventCategory;
  status?: EventStatus;
  is_published?: boolean;
  limit?: number;
  offset?: number;
}

export class EventsRepository {
  /**
   * Public retrieval: strictly filters for published events only.
   */
  public async findPublic(filters: PublicEventsFilter = {}): Promise<EventRow[]> {
    const conditions: string[] = ['is_published = true'];
    const params: any[] = [];

    if (filters.category) {
      params.push(filters.category);
      conditions.push(`category = $${params.length}`);
    }

    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;

    params.push(limit);
    const limitIdx = params.length;

    params.push(offset);
    const offsetIdx = params.length;

    const sql = `
      SELECT id, title, description, category, year, event_date, start_time, end_time,
             venue, registration_url, cover_image_url, status, is_published, is_featured,
             display_order, created_at, updated_at
      FROM events
      WHERE ${conditions.join(' AND ')}
      ORDER BY display_order ASC, event_date DESC NULLS LAST, created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const result = await query<EventRow>(sql, params);
    return result.rows;
  }

  /**
   * Admin retrieval: supports drafts, unpublished items, and filtering.
   */
  public async findAllAdmin(filters: AdminEventsFilter = {}): Promise<EventRow[]> {
    const conditions: string[] = ['1=1'];
    const params: any[] = [];

    if (filters.category) {
      params.push(filters.category);
      conditions.push(`category = $${params.length}`);
    }

    if (filters.status) {
      params.push(filters.status);
      conditions.push(`status = $${params.length}`);
    }

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
      SELECT id, title, description, category, year, event_date, start_time, end_time,
             venue, registration_url, cover_image_url, status, is_published, is_featured,
             display_order, created_at, updated_at
      FROM events
      WHERE ${conditions.join(' AND ')}
      ORDER BY display_order ASC, created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const result = await query<EventRow>(sql, params);
    return result.rows;
  }

  /**
   * Find a single event by ID.
   */
  public async findById(id: string): Promise<EventRow | null> {
    const sql = `
      SELECT id, title, description, category, year, event_date, start_time, end_time,
             venue, registration_url, cover_image_url, status, is_published, is_featured,
             display_order, created_at, updated_at
      FROM events
      WHERE id = $1
      LIMIT 1
    `;
    const result = await query<EventRow>(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Create a new event.
   */
  public async create(data: {
    title: string;
    description?: string | null;
    category: EventCategory;
    year?: number | null;
    event_date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    venue?: string | null;
    registration_url?: string | null;
    cover_image_url?: string | null;
    status?: EventStatus;
    is_published?: boolean;
    is_featured?: boolean;
    display_order?: number;
  }): Promise<EventRow> {
    const sql = `
      INSERT INTO events (
        title, description, category, year, event_date, start_time, end_time,
        venue, registration_url, cover_image_url, status, is_published, is_featured, display_order
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    const params = [
      data.title,
      data.description ?? null,
      data.category,
      data.year ?? null,
      data.event_date ?? null,
      data.start_time ?? null,
      data.end_time ?? null,
      data.venue ?? null,
      data.registration_url ?? null,
      data.cover_image_url ?? null,
      data.status ?? 'UPCOMING',
      data.is_published ?? false,
      data.is_featured ?? false,
      data.display_order ?? 0,
    ];

    const result = await query<EventRow>(sql, params);
    return result.rows[0];
  }

  /**
   * Update an existing event.
   */
  public async update(id: string, data: Partial<EventRow>): Promise<EventRow | null> {
    const fields: string[] = [];
    const params: any[] = [];

    const allowedKeys: (keyof EventRow)[] = [
      'title',
      'description',
      'category',
      'year',
      'event_date',
      'start_time',
      'end_time',
      'venue',
      'registration_url',
      'cover_image_url',
      'status',
      'is_published',
      'is_featured',
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
      UPDATE events
      SET ${fields.join(', ')}
      WHERE id = $${params.length}
      RETURNING *
    `;

    const result = await query<EventRow>(sql, params);
    return result.rows[0] || null;
  }

  /**
   * Toggle publication status.
   */
  public async togglePublish(id: string, isPublished?: boolean): Promise<EventRow | null> {
    const sql =
      isPublished !== undefined
        ? `UPDATE events SET is_published = $1 WHERE id = $2 RETURNING *`
        : `UPDATE events SET is_published = NOT is_published WHERE id = $1 RETURNING *`;
    const params = isPublished !== undefined ? [isPublished, id] : [id];

    const result = await query<EventRow>(sql, params);
    return result.rows[0] || null;
  }

  /**
   * Toggle featured status.
   */
  public async toggleFeatured(id: string, isFeatured?: boolean): Promise<EventRow | null> {
    const sql =
      isFeatured !== undefined
        ? `UPDATE events SET is_featured = $1 WHERE id = $2 RETURNING *`
        : `UPDATE events SET is_featured = NOT is_featured WHERE id = $1 RETURNING *`;
    const params = isFeatured !== undefined ? [isFeatured, id] : [id];

    const result = await query<EventRow>(sql, params);
    return result.rows[0] || null;
  }

  /**
   * Delete an event.
   */
  public async delete(id: string): Promise<boolean> {
    const sql = `DELETE FROM events WHERE id = $1`;
    const result = await query(sql, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}

export const eventsRepository = new EventsRepository();
