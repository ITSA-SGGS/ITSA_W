import { api } from '../lib/api';
import { getActiveCommitteeMembers } from './teamService';
import { Position, PositionFormData, CommitteeTier } from '../types';

function mapDbPositionToApp(row: any): Position {
  return {
    id: row.id,
    name: row.name,
    tier: row.tier,
    domain: row.domain || 'OVERALL',
    description: row.description || null,
    display_order: row.display_order ?? 0,
    is_active: row.is_active ?? true,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ============================================================================
// READ QUERIES
// ============================================================================

/**
 * Fetches all positions for the Admin Management interface.
 */
export async function getAllAdminPositions(): Promise<Position[]> {
  const data = await api.get<any[]>('/api/admin/positions?limit=100');
  return (data || []).map(mapDbPositionToApp);
}

/**
 * Fetches active positions for organizational dropdowns and suggestions.
 */
export async function getActivePositions(): Promise<Position[]> {
  try {
    const data = await api.get<any[]>('/api/positions');
    return (data || []).map(mapDbPositionToApp);
  } catch (err) {
    console.error('Failed to fetch active positions from API:', err);
    return [];
  }
}

/**
 * Fetches active positions by specific tier.
 */
export async function getActivePositionsByTier(tier: CommitteeTier): Promise<Position[]> {
  try {
    const data = await api.get<any[]>(`/api/positions?tier=${encodeURIComponent(tier)}`);
    return (data || []).map(mapDbPositionToApp);
  } catch (err) {
    console.error(`Failed to fetch positions for tier ${tier} from API:`, err);
    return [];
  }
}

// ============================================================================
// MUTATIONS (Governed by RLS)
// ============================================================================

/**
 * Checks if a position is currently assigned to any committee members.
 */
export async function checkPositionInUse(positionName: string): Promise<boolean> {
  const normName = positionName.trim().toLowerCase();

  try {
    const members = await getActiveCommitteeMembers();
    return members.some((m) => m.position?.trim().toLowerCase() === normName);
  } catch (err) {
    console.warn('Failed to check position reference count:', err);
    return false;
  }
}

/**
 * Creates a new position.
 */
export async function createPosition(formData: PositionFormData): Promise<Position> {
  const name = formData.name.trim();
  if (!name) {
    throw new Error('Position Name cannot be empty.');
  }

  const payload = {
    name,
    tier: formData.tier,
    domain: formData.domain?.trim() || 'OVERALL',
    description: formData.description?.trim() || null,
    display_order: Number(formData.display_order) || 0,
    is_active: Boolean(formData.is_active),
  };

  const data = await api.post<any>('/api/admin/positions', payload);
  return mapDbPositionToApp(data);
}

/**
 * Updates an existing position.
 */
export async function updatePosition(
  id: string,
  formData: Partial<PositionFormData>
): Promise<Position> {
  const payload: any = {};
  if (formData.name !== undefined) payload.name = formData.name.trim();
  if (formData.tier !== undefined) payload.tier = formData.tier;
  if (formData.domain !== undefined) payload.domain = formData.domain?.trim() || 'OVERALL';
  if (formData.description !== undefined) payload.description = formData.description?.trim() || null;
  if (formData.display_order !== undefined) payload.display_order = Number(formData.display_order);
  if (formData.is_active !== undefined) payload.is_active = Boolean(formData.is_active);

  const data = await api.put<any>(`/api/admin/positions/${encodeURIComponent(id)}`, payload);
  return mapDbPositionToApp(data);
}

/**
 * Toggles active/inactive status (is_active).
 */
export async function togglePositionActive(
  id: string,
  currentStatus: boolean
): Promise<Position> {
  const data = await api.patch<any>(`/api/admin/positions/${encodeURIComponent(id)}/active`, {
    is_active: !currentStatus,
  });
  return mapDbPositionToApp(data);
}

/**
 * Safely deletes a position record.
 */
export async function deletePosition(id: string, positionName: string): Promise<void> {
  const inUse = await checkPositionInUse(positionName);
  if (inUse) {
    throw new Error(
      `Cannot delete "${positionName}" because it is currently assigned to existing committee members. Deactivate the position instead to preserve data integrity.`
    );
  }

  await api.delete<{ message: string }>(`/api/admin/positions/${encodeURIComponent(id)}`);
}
