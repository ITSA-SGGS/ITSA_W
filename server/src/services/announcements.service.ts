import {
  announcementsRepository,
  AdminAnnouncementsFilter,
} from '../repositories/announcements.repository.js';
import { AnnouncementRow } from '../types/database.js';
import { NotFoundError } from '../utils/errors.js';

export class AnnouncementsService {
  public async getActiveAnnouncements(): Promise<AnnouncementRow[]> {
    return announcementsRepository.findActivePublic();
  }

  public async getAdminAnnouncements(
    filters: AdminAnnouncementsFilter = {}
  ): Promise<AnnouncementRow[]> {
    return announcementsRepository.findAllAdmin(filters);
  }

  public async getAnnouncementById(id: string): Promise<AnnouncementRow> {
    const record = await announcementsRepository.findById(id);
    if (!record) {
      throw new NotFoundError(`Announcement with ID "${id}" not found.`);
    }
    return record;
  }

  public async createAnnouncement(data: {
    title: string;
    message?: string | null;
    link_url?: string | null;
    is_published?: boolean;
    published_at?: string | null;
    expires_at?: string | null;
    display_order?: number;
  }): Promise<AnnouncementRow> {
    return announcementsRepository.create(data);
  }

  public async updateAnnouncement(
    id: string,
    data: Partial<AnnouncementRow>
  ): Promise<AnnouncementRow> {
    const existing = await announcementsRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Announcement with ID "${id}" not found.`);
    }
    const updated = await announcementsRepository.update(id, data);
    return updated!;
  }

  public async togglePublish(id: string, isPublished?: boolean): Promise<AnnouncementRow> {
    const existing = await announcementsRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Announcement with ID "${id}" not found.`);
    }
    const updated = await announcementsRepository.togglePublish(id, isPublished);
    return updated!;
  }

  public async deleteAnnouncement(id: string): Promise<void> {
    const existing = await announcementsRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Announcement with ID "${id}" not found.`);
    }
    await announcementsRepository.delete(id);
  }
}

export const announcementsService = new AnnouncementsService();
