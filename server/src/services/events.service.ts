import { eventsRepository, PublicEventsFilter, AdminEventsFilter } from '../repositories/events.repository.js';
import { EventRow, EventCategory, EventStatus } from '../types/database.js';
import { NotFoundError } from '../utils/errors.js';

export class EventsService {
  public async getPublicEvents(filters: PublicEventsFilter = {}): Promise<EventRow[]> {
    return eventsRepository.findPublic(filters);
  }

  public async getAdminEvents(filters: AdminEventsFilter = {}): Promise<EventRow[]> {
    return eventsRepository.findAllAdmin(filters);
  }

  public async getEventById(id: string): Promise<EventRow> {
    const event = await eventsRepository.findById(id);
    if (!event) {
      throw new NotFoundError(`Event with ID "${id}" not found.`);
    }
    return event;
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
    return eventsRepository.create(data);
  }

  public async updateEvent(id: string, data: Partial<EventRow>): Promise<EventRow> {
    const existing = await eventsRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Event with ID "${id}" not found.`);
    }
    const updated = await eventsRepository.update(id, data);
    return updated!;
  }

  public async togglePublish(id: string, isPublished?: boolean): Promise<EventRow> {
    const existing = await eventsRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Event with ID "${id}" not found.`);
    }
    const updated = await eventsRepository.togglePublish(id, isPublished);
    return updated!;
  }

  public async toggleFeatured(id: string, isFeatured?: boolean): Promise<EventRow> {
    const existing = await eventsRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Event with ID "${id}" not found.`);
    }
    const updated = await eventsRepository.toggleFeatured(id, isFeatured);
    return updated!;
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
