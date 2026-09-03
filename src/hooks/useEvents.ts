import { useState, useEffect, useCallback } from 'react';
import { SampleEvent, EventCategoryType, EventFormData } from '../types';
import {
  getPublishedEvents,
  getPublishedEventsByCategory,
  getAllAdminEvents,
  createEvent as serviceCreateEvent,
  updateEvent as serviceUpdateEvent,
  deleteEvent as serviceDeleteEvent,
  togglePublishEvent as serviceTogglePublish,
  toggleFeatureEvent as serviceToggleFeature,
} from '../services/eventsService';

interface UseEventsOptions {
  category?: EventCategoryType | string | null;
  adminMode?: boolean;
}

export function useEvents(optionsOrCategory?: EventCategoryType | string | null | UseEventsOptions) {
  let category: EventCategoryType | string | null | undefined = null;
  let adminMode = false;

  if (typeof optionsOrCategory === 'object' && optionsOrCategory !== null) {
    category = optionsOrCategory.category;
    adminMode = Boolean(optionsOrCategory.adminMode);
  } else if (typeof optionsOrCategory === 'string') {
    category = optionsOrCategory;
  }

  const [events, setEvents] = useState<SampleEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let data: SampleEvent[];
      if (adminMode) {
        data = await getAllAdminEvents();
      } else if (category && category !== 'ALL' && category !== 'ALL EVENTS') {
        data = await getPublishedEventsByCategory(category);
      } else {
        data = await getPublishedEvents();
      }
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [category, adminMode]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Mutation helpers
  const handleCreate = async (formData: EventFormData): Promise<SampleEvent> => {
    const created = await serviceCreateEvent(formData);
    await fetchEvents();
    return created;
  };

  const handleUpdate = async (id: string, formData: Partial<EventFormData>): Promise<SampleEvent> => {
    const updated = await serviceUpdateEvent(id, formData);
    await fetchEvents();
    return updated;
  };

  const handleDelete = async (id: string): Promise<void> => {
    await serviceDeleteEvent(id);
    await fetchEvents();
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean): Promise<SampleEvent> => {
    const updated = await serviceTogglePublish(id, currentStatus);
    await fetchEvents();
    return updated;
  };

  const handleToggleFeature = async (id: string, currentStatus: boolean): Promise<SampleEvent> => {
    const updated = await serviceToggleFeature(id, currentStatus);
    await fetchEvents();
    return updated;
  };

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
    createEvent: handleCreate,
    updateEvent: handleUpdate,
    deleteEvent: handleDelete,
    togglePublish: handleTogglePublish,
    toggleFeature: handleToggleFeature,
  };
}
