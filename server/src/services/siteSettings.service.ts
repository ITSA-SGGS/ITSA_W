import { siteSettingsRepository } from '../repositories/siteSettings.repository.js';
import { SiteSettingRow } from '../types/database.js';

export class SiteSettingsService {
  /**
   * Retrieves only public-safe settings as a key-value dictionary.
   */
  public async getPublicSettings(): Promise<Record<string, any>> {
    return siteSettingsRepository.findPublic();
  }

  /**
   * Retrieves all site settings for the Admin interface.
   */
  public async getAllSettings(): Promise<SiteSettingRow[]> {
    return siteSettingsRepository.findAllAdmin();
  }

  /**
   * Batch upsert settings.
   */
  public async batchUpdateSettings(settingsMap: Record<string, any>): Promise<void> {
    await siteSettingsRepository.upsertBatch(settingsMap);
  }

  /**
   * Upsert a single setting.
   */
  public async updateSingleSetting(
    key: string,
    value: any,
    description?: string | null,
    isPublic: boolean = true
  ): Promise<SiteSettingRow> {
    return siteSettingsRepository.upsertSingle(key, value, description, isPublic);
  }
}

export const siteSettingsService = new SiteSettingsService();
