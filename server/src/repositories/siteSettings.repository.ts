import { query, getPool } from '../config/database.js';
import { SiteSettingRow } from '../types/database.js';

export class SiteSettingsRepository {
  /**
   * Public retrieval: returns only settings marked is_public = true as a key-value dictionary.
   * Never exposes private administrative configuration or secrets.
   */
  public async findPublic(): Promise<Record<string, any>> {
    const sql = `
      SELECT key, value
      FROM site_settings
      WHERE is_public = true
    `;
    const result = await query<{ key: string; value: any }>(sql);
    const settingsMap: Record<string, any> = {};
    for (const row of result.rows) {
      settingsMap[row.key] = row.value;
    }
    return settingsMap;
  }

  /**
   * Admin retrieval: returns all site settings records.
   */
  public async findAllAdmin(): Promise<SiteSettingRow[]> {
    const sql = `
      SELECT id, key, value, description, is_public, updated_at
      FROM site_settings
      ORDER BY key ASC
    `;
    const result = await query<SiteSettingRow>(sql);
    return result.rows;
  }

  /**
   * Find single setting by key.
   */
  public async findByKey(key: string): Promise<SiteSettingRow | null> {
    const sql = `
      SELECT id, key, value, description, is_public, updated_at
      FROM site_settings
      WHERE key = $1
      LIMIT 1
    `;
    const result = await query<SiteSettingRow>(sql, [key]);
    return result.rows[0] || null;
  }

  /**
   * Upsert a single setting by key.
   */
  public async upsertSingle(
    key: string,
    value: any,
    description?: string | null,
    isPublic: boolean = true
  ): Promise<SiteSettingRow> {
    const sql = `
      INSERT INTO site_settings (key, value, description, is_public, updated_at)
      VALUES ($1, $2::jsonb, $3, $4, now())
      ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value,
          description = COALESCE(EXCLUDED.description, site_settings.description),
          is_public = EXCLUDED.is_public,
          updated_at = now()
      RETURNING *
    `;
    const params = [key, JSON.stringify(value), description ?? null, isPublic];
    const result = await query<SiteSettingRow>(sql, params);
    return result.rows[0];
  }

  /**
   * Batch upsert site settings within a transaction.
   */
  public async upsertBatch(settingsMap: Record<string, any>): Promise<void> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const [key, value] of Object.entries(settingsMap)) {
        const sql = `
          INSERT INTO site_settings (key, value, is_public, updated_at)
          VALUES ($1, $2::jsonb, true, now())
          ON CONFLICT (key) DO UPDATE
          SET value = EXCLUDED.value,
              updated_at = now()
        `;
        await client.query(sql, [key, JSON.stringify(value)]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export const siteSettingsRepository = new SiteSettingsRepository();
