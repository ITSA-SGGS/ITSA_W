import {
  archiveRepository,
  PublicArchiveFilter,
  AdminArchiveFilter,
} from '../repositories/archive.repository.js';
import { ArchiveRecordRow } from '../types/database.js';
import { NotFoundError } from '../utils/errors.js';

export class ArchiveService {
  public async getPublicArchive(filters: PublicArchiveFilter = {}): Promise<ArchiveRecordRow[]> {
    return archiveRepository.findPublic(filters);
  }

  public async getAdminArchive(filters: AdminArchiveFilter = {}): Promise<ArchiveRecordRow[]> {
    return archiveRepository.findAllAdmin(filters);
  }

  public async getArchiveById(id: string): Promise<ArchiveRecordRow> {
    const record = await archiveRepository.findById(id);
    if (!record) {
      throw new NotFoundError(`Archive record with ID "${id}" not found.`);
    }
    return record;
  }

  public async createArchiveRecord(data: {
    title?: string | null;
    description?: string | null;
    image_url: string;
    year?: number | null;
    event_name?: string | null;
    display_order?: number;
    is_published?: boolean;
  }): Promise<ArchiveRecordRow> {
    return archiveRepository.create(data);
  }

  public async updateArchiveRecord(
    id: string,
    data: Partial<ArchiveRecordRow>
  ): Promise<ArchiveRecordRow> {
    const existing = await archiveRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Archive record with ID "${id}" not found.`);
    }
    const updated = await archiveRepository.update(id, data);
    return updated!;
  }

  public async togglePublish(id: string, isPublished?: boolean): Promise<ArchiveRecordRow> {
    const existing = await archiveRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Archive record with ID "${id}" not found.`);
    }
    const updated = await archiveRepository.togglePublish(id, isPublished);
    return updated!;
  }

  public async deleteArchiveRecord(id: string): Promise<void> {
    const existing = await archiveRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Archive record with ID "${id}" not found.`);
    }
    await archiveRepository.delete(id);
  }
}

export const archiveService = new ArchiveService();
