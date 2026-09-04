import { query } from '../config/database.js';
import { DashboardMetrics } from '../types/cms.js';

export class MetricsRepository {
  /**
   * Retrieves aggregate dashboard metrics in a single efficient SQL query.
   * Performs zero whole-table scans or client-side filtering.
   */
  public async getDashboardMetrics(): Promise<DashboardMetrics> {
    const sql = `
      SELECT
        (SELECT count(*)::int FROM events) AS total_events,
        (SELECT count(*)::int FROM committee_members WHERE is_active = true) AS total_active_members,
        (SELECT count(*)::int FROM archive_records) AS total_archive_photos,
        (SELECT count(*)::int FROM positions) AS total_positions;
    `;

    const result = await query<{
      total_events: number;
      total_active_members: number;
      total_archive_photos: number;
      total_positions: number;
    }>(sql);

    const row = result.rows[0];
    return {
      totalEvents: row?.total_events ?? 0,
      totalActiveMembers: row?.total_active_members ?? 0,
      totalArchivePhotos: row?.total_archive_photos ?? 0,
      totalPositions: row?.total_positions ?? 0,
    };
  }
}

export const metricsRepository = new MetricsRepository();
