import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Position, PositionFormData, CommitteeTier } from '../types';

// Initial in-memory positions fallback derived from official ITSA structure
let inMemoryPositions: Position[] = [
  // Core
  { id: 'pos-1', name: 'President', tier: 'CORE', domain: 'OVERALL', description: 'Leads the executive committee and overall organization operations.', display_order: 1, is_active: true },
  { id: 'pos-2', name: 'Vice President', tier: 'CORE', domain: 'OVERALL', description: 'Assists the President and oversees committee portfolio alignment.', display_order: 2, is_active: true },
  { id: 'pos-3', name: 'Treasurer', tier: 'CORE', domain: 'FINANCE', description: 'Directs the treasury, budgets, sponsorships, and fiscal logistics.', display_order: 3, is_active: true },
  { id: 'pos-4', name: 'Vice Treasurer', tier: 'CORE', domain: 'FINANCE', description: 'Assists in financial accounting, auditing, and procurement records.', display_order: 4, is_active: true },

  // TY Leadership
  { id: 'pos-5', name: 'Technical Head', tier: 'TY_LEADERSHIP', domain: 'TECHNICAL', description: 'Oversees technical development, hackathons, and server operations.', display_order: 5, is_active: true },
  { id: 'pos-6', name: 'Technical Co-Head', tier: 'TY_LEADERSHIP', domain: 'TECHNICAL', description: 'Co-leads technical symposiums, code reviews, and workshops.', display_order: 6, is_active: true },
  { id: 'pos-7', name: 'Event Operations Head', tier: 'TY_LEADERSHIP', domain: 'OPERATIONS', description: 'Directs logistics, venue setups, permissions, and event scheduling.', display_order: 7, is_active: true },
  { id: 'pos-8', name: 'Event Operations Co-Head', tier: 'TY_LEADERSHIP', domain: 'OPERATIONS', description: 'Assists with operational execution, crowd flow, and stagecraft.', display_order: 8, is_active: true },
  { id: 'pos-9', name: 'Media Head', tier: 'TY_LEADERSHIP', domain: 'MEDIA', description: 'Leads branding, photography, videography, and graphic assets.', display_order: 9, is_active: true },
  { id: 'pos-10', name: 'Media Co-Head', tier: 'TY_LEADERSHIP', domain: 'MEDIA', description: 'Co-leads design editorial, social publicity, and live streaming.', display_order: 10, is_active: true },
  { id: 'pos-11', name: 'Anchoring Head', tier: 'TY_LEADERSHIP', domain: 'ANCHORING', description: 'Oversees master of ceremonies, scripting, and stage moderation.', display_order: 11, is_active: true },
  { id: 'pos-12', name: 'Anchoring Co-Head', tier: 'TY_LEADERSHIP', domain: 'ANCHORING', description: 'Co-leads public announcements, stage dialogue, and host panels.', display_order: 12, is_active: true },
  { id: 'pos-13', name: 'Sports Head', tier: 'TY_LEADERSHIP', domain: 'SPORTS', description: 'Organizes intra-department sports leagues, fixtures, and referees.', display_order: 13, is_active: true },
  { id: 'pos-14', name: 'Sports Co-Head', tier: 'TY_LEADERSHIP', domain: 'SPORTS', description: 'Assists in athletic tournaments, equipment, and sports logistics.', display_order: 14, is_active: true },
  { id: 'pos-15', name: 'Alumni & Relations Head', tier: 'TY_LEADERSHIP', domain: 'ALUMNI', description: 'Manages alumni connections, industry outreach, and sponsorships.', display_order: 15, is_active: true },
  { id: 'pos-16', name: 'Alumni & Relations Co-Head', tier: 'TY_LEADERSHIP', domain: 'ALUMNI', description: 'Co-leads networking events, mentorship programs, and relations.', display_order: 16, is_active: true },

  // SY Coordinators
  { id: 'pos-17', name: 'Main Coordinator', tier: 'SY_COORDINATOR', domain: 'OVERALL', description: 'Primary coordinator for overall batch execution.', display_order: 17, is_active: true },
  { id: 'pos-18', name: 'Joint Coordinator', tier: 'SY_COORDINATOR', domain: 'OVERALL', description: 'Joint coordinator supporting overall execution.', display_order: 18, is_active: true },
  { id: 'pos-19', name: 'Technical Main Coordinator', tier: 'SY_COORDINATOR', domain: 'TECHNICAL', description: 'Coordinates labs, technical submissions, and problem sets.', display_order: 19, is_active: true },
  { id: 'pos-20', name: 'Technical Joint Coordinator', tier: 'SY_COORDINATOR', domain: 'TECHNICAL', description: 'Assists in lab installations and technical setup.', display_order: 20, is_active: true },
  { id: 'pos-21', name: 'Media Main Coordinator', tier: 'SY_COORDINATOR', domain: 'MEDIA', description: 'Coordinates visual captures and design collateral.', display_order: 21, is_active: true },
  { id: 'pos-22', name: 'Media Joint Coordinator', tier: 'SY_COORDINATOR', domain: 'MEDIA', description: 'Assists with real-time social stories and photo sorting.', display_order: 22, is_active: true },
  { id: 'pos-23', name: 'Anchoring Main Coordinator', tier: 'SY_COORDINATOR', domain: 'ANCHORING', description: 'Coordinates speaker intros and agenda announcements.', display_order: 23, is_active: true },
  { id: 'pos-24', name: 'Anchoring Joint Coordinator', tier: 'SY_COORDINATOR', domain: 'ANCHORING', description: 'Assists on-stage emcees with cue cards and runner coordination.', display_order: 24, is_active: true },
  { id: 'pos-25', name: 'Finance Main Coordinator', tier: 'SY_COORDINATOR', domain: 'FINANCE', description: 'Coordinates receipt ledger entries and participant registrations.', display_order: 25, is_active: true },
  { id: 'pos-26', name: 'Finance Joint Coordinator', tier: 'SY_COORDINATOR', domain: 'FINANCE', description: 'Assists in entry desk receipts and ticket validation.', display_order: 26, is_active: true },
  { id: 'pos-27', name: 'Sports Main Coordinator', tier: 'SY_COORDINATOR', domain: 'SPORTS', description: 'Coordinates match schedules, court bookings, and scoreboard logs.', display_order: 27, is_active: true },
  { id: 'pos-28', name: 'Sports Joint Coordinator', tier: 'SY_COORDINATOR', domain: 'SPORTS', description: 'Assists in tournament refereeing and medal ceremonies.', display_order: 28, is_active: true },
  { id: 'pos-29', name: 'Alumni & Relations Main Coordinator', tier: 'SY_COORDINATOR', domain: 'ALUMNI', description: 'Coordinates guest reception, hospitality, and memento delivery.', display_order: 29, is_active: true },

  // Faculty Advisory
  { id: 'pos-30', name: 'ITSA Faculty Coordinator', tier: 'FACULTY', domain: 'OVERALL', description: 'Faculty advisor overseeing governance, standards, and institutional compliance.', display_order: 30, is_active: true },
  { id: 'pos-31', name: 'Head of the Department', tier: 'FACULTY', domain: 'OVERALL', description: 'Head of the Department of Information Technology.', display_order: 31, is_active: true },
  { id: 'pos-32', name: 'Dean Student Activities', tier: 'FACULTY', domain: 'OVERALL', description: 'Dean of Student Activities advising student governance.', display_order: 32, is_active: true },
];

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
  if (!isSupabaseConfigured) {
    return [...inMemoryPositions].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }

  try {
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.warn('Supabase positions query failed, using fallback:', error.message);
      return [...inMemoryPositions].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    }

    if (!data || data.length === 0) {
      return [...inMemoryPositions].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    }

    return data.map(mapDbPositionToApp);
  } catch (err) {
    console.warn('Failed to fetch positions from Supabase:', err);
    return [...inMemoryPositions].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }
}

/**
 * Fetches active positions for organizational dropdowns and suggestions.
 */
export async function getActivePositions(): Promise<Position[]> {
  if (!isSupabaseConfigured) {
    return inMemoryPositions.filter((p) => p.is_active);
  }

  try {
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.warn('Supabase active positions query failed:', error.message);
      return inMemoryPositions.filter((p) => p.is_active);
    }

    if (!data || data.length === 0) {
      return inMemoryPositions.filter((p) => p.is_active);
    }

    return data.map(mapDbPositionToApp);
  } catch (err) {
    console.warn('Failed to fetch active positions:', err);
    return inMemoryPositions.filter((p) => p.is_active);
  }
}

/**
 * Fetches active positions by specific tier.
 */
export async function getActivePositionsByTier(tier: CommitteeTier): Promise<Position[]> {
  const allActive = await getActivePositions();
  return allActive.filter((p) => p.tier === tier);
}

// ============================================================================
// MUTATIONS (Governed by RLS)
// ============================================================================

/**
 * Checks if a position is currently assigned to any committee members.
 */
export async function checkPositionInUse(positionName: string): Promise<boolean> {
  const normName = positionName.trim().toLowerCase();

  if (!isSupabaseConfigured) {
    // In mock mode, check in-memory members
    return true; // Conservative safety
  }

  try {
    const { count, error } = await supabase
      .from('committee_members')
      .select('*', { count: 'exact', head: true })
      .ilike('position', normName);

    if (error) {
      console.warn('Failed to check position reference count:', error.message);
      return true; // Conservative safety
    }

    return (count ?? 0) > 0;
  } catch (err) {
    console.warn('Reference check error:', err);
    return true;
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

  if (!isSupabaseConfigured) {
    // Check local duplicate
    const exists = inMemoryPositions.some(
      (p) => p.is_active && p.name.toLowerCase() === name.toLowerCase() && p.tier === payload.tier
    );
    if (exists) {
      throw new Error(`An active position with the title "${name}" already exists in ${payload.tier}.`);
    }

    const newMock: Position = {
      id: `mock-pos-${Date.now()}`,
      name: payload.name,
      tier: payload.tier,
      domain: payload.domain,
      description: payload.description,
      display_order: payload.display_order,
      is_active: payload.is_active,
      created_at: new Date().toISOString(),
    };
    inMemoryPositions = [...inMemoryPositions, newMock];
    return newMock;
  }

  // Check for duplicate active role in Supabase
  const { data: existing } = await supabase
    .from('positions')
    .select('id')
    .ilike('name', name)
    .eq('tier', payload.tier)
    .eq('is_active', true)
    .maybeSingle();

  if (existing) {
    throw new Error(`An active position titled "${name}" already exists in ${payload.tier}.`);
  }

  const { data, error } = await (supabase
    .from('positions') as any)
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to create position.');
  }

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

  if (!isSupabaseConfigured) {
    inMemoryPositions = inMemoryPositions.map((p) => {
      if (p.id === id) {
        return { ...p, ...payload };
      }
      return p;
    });
    const updated = inMemoryPositions.find((p) => p.id === id)!;
    return updated;
  }

  const { data, error } = await (supabase
    .from('positions') as any)
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to update position.');
  }

  return mapDbPositionToApp(data);
}

/**
 * Toggles active/inactive status (is_active).
 */
export async function togglePositionActive(
  id: string,
  currentStatus: boolean
): Promise<Position> {
  return updatePosition(id, { is_active: !currentStatus });
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

  if (!isSupabaseConfigured) {
    inMemoryPositions = inMemoryPositions.filter((p) => p.id !== id);
    return;
  }

  const { error } = await supabase
    .from('positions')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Failed to delete position.');
  }
}
