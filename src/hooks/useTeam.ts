import { useState, useEffect, useCallback, useMemo } from 'react';
import { CommitteeMember, MemberFormData } from '../types';
import {
  getActiveCommitteeMembers,
  getAllAdminMembers,
  createMember as serviceCreateMember,
  updateMember as serviceUpdateMember,
  toggleMemberActive as serviceToggleActive,
  deleteMember as serviceDeleteMember,
} from '../services/teamService';

interface UseTeamOptions {
  adminMode?: boolean;
}

export function useTeam(options?: UseTeamOptions) {
  const adminMode = Boolean(options?.adminMode);

  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = adminMode ? await getAllAdminMembers() : await getActiveCommitteeMembers();
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [adminMode]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Derived structured groups matching the UI tiers
  const coreMembers = useMemo(() => {
    return members.filter((m) => m.tier === 'CORE');
  }, [members]);

  const tyMembers = useMemo(() => {
    return members.filter((m) => m.tier === 'TY_LEADERSHIP');
  }, [members]);

  const syMembers = useMemo(() => {
    return members.filter((m) => m.tier === 'SY_COORDINATOR');
  }, [members]);

  const facultyDignitaries = useMemo(() => {
    return members.filter((m) => m.tier === 'FACULTY');
  }, [members]);

  // Dynamic grouping for SY Coordinators by domain
  const syCoordinatorGroups = useMemo(() => {
    const domainOrder = ['OVERALL', 'TECHNICAL', 'ANCHORING', 'MEDIA', 'FINANCE', 'SPORTS', 'ALUMNI', 'OPERATIONS'];
    const domainTitles: Record<string, string> = {
      OVERALL: 'OVERALL COORDINATION',
      TECHNICAL: 'TECHNICAL',
      ANCHORING: 'ANCHORING',
      MEDIA: 'MEDIA',
      FINANCE: 'FINANCE',
      SPORTS: 'SPORTS',
      ALUMNI: 'ALUMNI & RELATIONS',
      OPERATIONS: 'OPERATIONS',
    };

    const grouped: Record<string, CommitteeMember[]> = {};
    for (const m of syMembers) {
      const dom = (m.domain || 'OVERALL').toUpperCase();
      if (!grouped[dom]) grouped[dom] = [];
      grouped[dom].push(m);
    }

    const result = [];
    for (const dom of domainOrder) {
      if (grouped[dom] && grouped[dom].length > 0) {
        result.push({
          domainName: domainTitles[dom] || dom,
          domainKey: dom,
          members: grouped[dom],
        });
      }
    }

    // Add any remaining custom domains
    for (const dom of Object.keys(grouped)) {
      if (!domainOrder.includes(dom)) {
        result.push({
          domainName: dom,
          domainKey: dom,
          members: grouped[dom],
        });
      }
    }

    return result;
  }, [syMembers]);

  // Mutation helpers
  const handleCreate = async (formData: MemberFormData): Promise<CommitteeMember> => {
    const created = await serviceCreateMember(formData);
    await fetchMembers();
    return created;
  };

  const handleUpdate = async (id: string, formData: Partial<MemberFormData>): Promise<CommitteeMember> => {
    const updated = await serviceUpdateMember(id, formData);
    await fetchMembers();
    return updated;
  };

  const handleToggleActive = async (id: string, currentStatus: boolean): Promise<CommitteeMember> => {
    const updated = await serviceToggleActive(id, currentStatus);
    await fetchMembers();
    return updated;
  };

  const handleDelete = async (id: string): Promise<void> => {
    await serviceDeleteMember(id);
    await fetchMembers();
  };

  return {
    members,
    coreMembers,
    tyMembers,
    syMembers,
    syCoordinatorGroups,
    facultyDignitaries,
    loading,
    error,
    refetch: fetchMembers,
    createMember: handleCreate,
    updateMember: handleUpdate,
    toggleActive: handleToggleActive,
    deleteMember: handleDelete,
  };
}
