import { eventsRepository, PublicEventsFilter, AdminEventsFilter } from '../repositories/events.repository.js';
import { EventRow, EventCategory, EventStatus } from '../types/database.js';
import { NotFoundError } from '../utils/errors.js';
import { storageService } from '../storage/storage.service.js';

async function resolveEventMedia(event: EventRow): Promise<EventRow> {
  if (!event.cover_image_url) return event;
  const resolved = await storageService.resolveSignedUrl(event.cover_image_url);
  return {
    ...event,
    cover_image_url: resolved || event.cover_image_url,
  };
}

export class EventsService {
  public async getPublicEvents(filters: PublicEventsFilter = {}): Promise<EventRow[]> {
    const events = await eventsRepository.findPublic(filters);
    return Promise.all(events.map(resolveEventMedia));
  }

  public async getAdminEvents(filters: AdminEventsFilter = {}): Promise<EventRow[]> {
    const events = await eventsRepository.findAllAdmin(filters);
    return Promise.all(events.map(resolveEventMedia));
  }

  public async getEventById(id: string): Promise<EventRow> {
    const event = await eventsRepository.findById(id);
    if (!event) {
      throw new NotFoundError(`Event with ID "${id}" not found.`);
    }
    return resolveEventMedia(event);
  }

  public async createEvent(data: {
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
    const payload = { ...data };
    if (payload.cover_image_url) {
      const canonicalKey = storageService.extractKey(payload.cover_image_url);
      if (canonicalKey) {
        payload.cover_image_url = canonicalKey;
      }
    }
    const created = await eventsRepository.create(payload);
    return resolveEventMedia(created);
  }

  public async updateEvent(id: string, data: Partial<EventRow>): Promise<EventRow> {
    const existing = await eventsRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Event with ID "${id}" not found.`);
    }
    const payload = { ...data };
    if (payload.cover_image_url) {
      const canonicalKey = storageService.extractKey(payload.cover_image_url);
      if (canonicalKey) {
        payload.cover_image_url = canonicalKey;
      }
    }
    const updated = await eventsRepository.update(id, payload);
    return resolveEventMedia(updated!);
  }

  public async togglePublish(id: string, isPublished?: boolean): Promise<EventRow> {
    const existing = await eventsRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Event with ID "${id}" not found.`);
    }
    const updated = await eventsRepository.togglePublish(id, isPublished);
    return resolveEventMedia(updated!);
  }

  public async toggleFeatured(id: string, isFeatured?: boolean): Promise<EventRow> {
    const existing = await eventsRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Event with ID "${id}" not found.`);
    }
    const updated = await eventsRepository.toggleFeatured(id, isFeatured);
    return resolveEventMedia(updated!);
  }

  public async deleteEvent(id: string): Promise<void> {
    const existing = await eventsRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Event with ID "${id}" not found.`);
    }
    await eventsRepository.delete(id);
  }
}

export const eventsService = new EventsService();
