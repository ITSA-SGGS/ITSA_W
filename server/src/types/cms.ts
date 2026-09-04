import {
  EventCategory,
  EventStatus,
  CommitteeTier,
  AdminRole,
} from './database.js';

export interface DashboardMetrics {
  totalEvents: number;
  totalActiveMembers: number;
  totalArchivePhotos: number;
  totalPositions: number;
}

export interface PublicCommitteeMember {
  id: string;
  name: string;
  position: string;
  tier: CommitteeTier;
  domain: string | null;
  department: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  tenure_year: string;
  display_order: number;
}

export interface PublicEvent {
  id: string;
  title: string;
  description: string | null;
  category: EventCategory;
  year: number | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  registration_url: string | null;
  cover_image_url: string | null;
  status: EventStatus;
  is_published: boolean;
  is_featured: boolean;
  display_order: number;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface PublicPosition {
  id: string;
  name: string;
  tier: CommitteeTier;
  domain: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

export interface PublicArchiveRecord {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  year: number | null;
  event_name: string | null;
  display_order: number;
  is_published: boolean;
  created_at: Date | string;
}

export interface PublicAnnouncement {
  id: string;
  title: string;
  message: string | null;
  link_url: string | null;
  is_published: boolean;
  published_at: Date | string | null;
  expires_at: Date | string | null;
  display_order: number;
  created_at: Date | string;
}
