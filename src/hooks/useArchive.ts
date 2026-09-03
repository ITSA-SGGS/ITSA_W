import { useState, useEffect, useCallback, useMemo } from 'react';
import { GalleryItem, ArchiveFormData } from '../types';
import {
  getPublishedArchiveRecords,
  getAllAdminArchiveRecords,
  createArchiveRecord as serviceCreateRecord,
  updateArchiveRecord as serviceUpdateRecord,
  toggleArchivePublished as serviceTogglePublished,
  deleteArchiveRecord as serviceDeleteRecord,
} from '../services/archiveService';

interface UseArchiveOptions {
  adminMode?: boolean;
}

export function useArchive(options?: UseArchiveOptions) {
  const adminMode = Boolean(options?.adminMode);

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchArchive = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = adminMode ? await getAllAdminArchiveRecords() : await getPublishedArchiveRecords();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [adminMode]);

  useEffect(() => {
    fetchArchive();
  }, [fetchArchive]);

  // Editorial composition slices for public Gallery layout
  const leadAnchor = useMemo(() => items[0] || null, [items]);
  const secondaryAnchor = useMemo(() => items[1] || null, [items]);
  const triptych = useMemo(() => items.slice(2, 5), [items]);

  // Mutations
  const handleCreate = async (formData: ArchiveFormData): Promise<GalleryItem> => {
    const created = await serviceCreateRecord(formData);
    await fetchArchive();
    return created;
  };

  const handleUpdate = async (id: string, formData: Partial<ArchiveFormData>): Promise<GalleryItem> => {
    const updated = await serviceUpdateRecord(id, formData);
    await fetchArchive();
    return updated;
  };

  const handleTogglePublished = async (id: string, currentPublishedState: boolean): Promise<GalleryItem> => {
    const updated = await serviceTogglePublished(id, currentPublishedState);
    await fetchArchive();
    return updated;
  };

  const handleDelete = async (id: string): Promise<void> => {
    await serviceDeleteRecord(id);
    await fetchArchive();
  };

  return {
    items,
    leadAnchor,
    secondaryAnchor,
    triptych,
    loading,
    error,
    refetch: fetchArchive,
    createArchiveRecord: handleCreate,
    updateArchiveRecord: handleUpdate,
    togglePublished: handleTogglePublished,
    deleteArchiveRecord: handleDelete,
  };
}
