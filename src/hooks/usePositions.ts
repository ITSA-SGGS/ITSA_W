import { useState, useEffect, useCallback, useMemo } from 'react';
import { Position, PositionFormData, CommitteeTier } from '../types';
import {
  getAllAdminPositions,
  getActivePositions,
  getActivePositionsByTier,
  createPosition as serviceCreatePosition,
  updatePosition as serviceUpdatePosition,
  togglePositionActive as serviceToggleActive,
  deletePosition as serviceDeletePosition,
} from '../services/positionsService';

interface UsePositionsOptions {
  adminMode?: boolean;
  tier?: CommitteeTier;
}

export function usePositions(options?: UsePositionsOptions) {
  const adminMode = Boolean(options?.adminMode);
  const tier = options?.tier;

  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPositions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let data: Position[];
      if (adminMode) {
        data = await getAllAdminPositions();
      } else if (tier) {
        data = await getActivePositionsByTier(tier);
      } else {
        data = await getActivePositions();
      }
      setPositions(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [adminMode, tier]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  // Derived structured groups
  const corePositions = useMemo(() => positions.filter((p) => p.tier === 'CORE'), [positions]);
  const tyPositions = useMemo(() => positions.filter((p) => p.tier === 'TY_LEADERSHIP'), [positions]);
  const syPositions = useMemo(() => positions.filter((p) => p.tier === 'SY_COORDINATOR'), [positions]);
  const facultyPositions = useMemo(() => positions.filter((p) => p.tier === 'FACULTY'), [positions]);

  // Mutations
  const handleCreate = async (formData: PositionFormData): Promise<Position> => {
    const created = await serviceCreatePosition(formData);
    await fetchPositions();
    return created;
  };

  const handleUpdate = async (id: string, formData: Partial<PositionFormData>): Promise<Position> => {
    const updated = await serviceUpdatePosition(id, formData);
    await fetchPositions();
    return updated;
  };

  const handleToggleActive = async (id: string, currentStatus: boolean): Promise<Position> => {
    const updated = await serviceToggleActive(id, currentStatus);
    await fetchPositions();
    return updated;
  };

  const handleDelete = async (id: string, positionName: string): Promise<void> => {
    await serviceDeletePosition(id, positionName);
    await fetchPositions();
  };

  return {
    positions,
    corePositions,
    tyPositions,
    syPositions,
    facultyPositions,
    loading,
    error,
    refetch: fetchPositions,
    createPosition: handleCreate,
    updatePosition: handleUpdate,
    toggleActive: handleToggleActive,
    deletePosition: handleDelete,
  };
}
