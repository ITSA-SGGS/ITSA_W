import { useState, useEffect, useCallback } from 'react';
import { Announcement, AnnouncementFormData } from '../types';
import {
  getPublishedAnnouncements,
  getAllAdminAnnouncements,
  createAnnouncement as serviceCreateAnnouncement,
  updateAnnouncement as serviceUpdateAnnouncement,
  toggleAnnouncementPublished as serviceTogglePublished,
  deleteAnnouncement as serviceDeleteAnnouncement,
} from '../services/announcementsService';

interface UseAnnouncementsOptions {
  adminMode?: boolean;
}

export function useAnnouncements(options?: UseAnnouncementsOptions) {
  const adminMode = Boolean(options?.adminMode);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = adminMode
        ? await getAllAdminAnnouncements()
        : await getPublishedAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [adminMode]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Mutations
  const handleCreate = async (formData: AnnouncementFormData): Promise<Announcement> => {
    const created = await serviceCreateAnnouncement(formData);
    await fetchAnnouncements();
    return created;
  };

  const handleUpdate = async (id: string, formData: Partial<AnnouncementFormData>): Promise<Announcement> => {
    const updated = await serviceUpdateAnnouncement(id, formData);
    await fetchAnnouncements();
    return updated;
  };

  const handleTogglePublished = async (id: string, currentStatus: boolean): Promise<Announcement> => {
    const updated = await serviceTogglePublished(id, currentStatus);
    await fetchAnnouncements();
    return updated;
  };

  const handleDelete = async (id: string): Promise<void> => {
    await serviceDeleteAnnouncement(id);
    await fetchAnnouncements();
  };

  return {
    announcements,
    loading,
    error,
    refetch: fetchAnnouncements,
    createAnnouncement: handleCreate,
    updateAnnouncement: handleUpdate,
    togglePublished: handleTogglePublished,
    deleteAnnouncement: handleDelete,
  };
}
