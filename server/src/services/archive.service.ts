import {
  archiveRepository,
  PublicArchiveFilter,
  AdminArchiveFilter,
} from '../repositories/archive.repository.js';
import { ArchiveRecordRow } from '../types/database.js';
import { NotFoundError } from '../utils/errors.js';
import { storageService } from '../storage/storage.service.js';

async function resolveArchiveMedia(record: ArchiveRecordRow): Promise<ArchiveRecordRow> {
  if (!record.image_url) return record;
  const resolved = await storageService.resolveSignedUrl(record.image_url);
  return {
    ...record,
    image_url: resolved || record.image_url,
  };
}

export class ArchiveService {
  public async getPublicArchive(filters: PublicArchiveFilter = {}): Promise<ArchiveRecordRow[]> {
    const records = await archiveRepository.findPublic(filters);
    return Promise.all(records.map(resolveArchiveMedia));
  }

  public async getAdminArchive(filters: AdminArchiveFilter = {}): Promise<ArchiveRecordRow[]> {
    const records = await archiveRepository.findAllAdmin(filters);
    return Promise.all(records.map(resolveArchiveMedia));
  }

  public async getArchiveById(id: string): Promise<ArchiveRecordRow> {
    const record = await archiveRepository.findById(id);
    if (!record) {
      throw new NotFoundError(`Archive record with ID "${id}" not found.`);
    }
    return resolveArchiveMedia(record);
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
    const payload = { ...data };
    if (payload.image_url) {
      const canonicalKey = storageService.extractKey(payload.image_url);
      if (canonicalKey) {
        payload.image_url = canonicalKey;
      }
    }
    const created = await archiveRepository.create(payload);
    return resolveArchiveMedia(created);
  }

  public async updateArchiveRecord(
    id: string,
    data: Partial<ArchiveRecordRow>
  ): Promise<ArchiveRecordRow> {
    const existing = await archiveRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Archive record with ID "${id}" not found.`);
    }
    const payload = { ...data };
    if (payload.image_url) {
      const canonicalKey = storageService.extractKey(payload.image_url);
      if (canonicalKey) {
        payload.image_url = canonicalKey;
      }
    }
    const updated = await archiveRepository.update(id, payload);
    return resolveArchiveMedia(updated!);
  }

  public async togglePublish(id: string, isPublished?: boolean): Promise<ArchiveRecordRow> {
    const existing = await archiveRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Archive record with ID "${id}" not found.`);
    }
    const updated = await archiveRepository.togglePublish(id, isPublished);
    return resolveArchiveMedia(updated!);
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
