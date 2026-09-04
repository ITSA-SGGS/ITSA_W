/**
 * ITSA Backend - Neon PostgreSQL Database Type Definitions
 * Represents the 7 core tables in the decoupled architecture.
 */

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR';

export interface AdminUserRow {
  id: string;
  email: string;
  password_hash: string;
  full_name: string | null;
  role: AdminRole;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  last_login_at: Date | string | null;
}

export interface SafeAdminUser {
  id: string;
  email: string;
  full_name: string | null;
  role: AdminRole;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  last_login_at: Date | string | null;
}

export interface AdminSessionRow {
  id: string;
  token_hash: string;
  user_id: string;
  expires_at: Date | string;
  created_at: Date | string;
  user_agent: string | null;
  ip_address: string | null;
}

export type EventCategory = 'TECHNICAL' | 'SPORTS' | 'CULTURAL';
export type EventStatus = 'DRAFT' | 'UPCOMING' | 'ONGOING' | 'COMPLETED';

export interface EventRow {
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

export type CommitteeTier = 'CORE' | 'TY_LEADERSHIP' | 'SY_COORDINATOR' | 'FACULTY';

export interface CommitteeMemberRow {
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
  is_active: boolean;
  display_order: number;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface PositionRow {
  id: string;
  name: string;
  tier: CommitteeTier;
  domain: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ArchiveRecordRow {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  year: number | null;
  event_name: string | null;
  display_order: number;
  is_published: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface AnnouncementRow {
  id: string;
  title: string;
  message: string | null;
  link_url: string | null;
  is_published: boolean;
  published_at: Date | string | null;
  expires_at: Date | string | null;
  display_order: number;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface SiteSettingRow {
  id: string;
  key: string;
  value: any;
  description: string | null;
  is_public: boolean;
  updated_at: Date | string;
}
