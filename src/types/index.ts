export type Theme = 'dark' | 'light';

// ============================================================================
// EVENT TYPES
// ============================================================================
export type EventCategoryType = 'TECHNICAL EVENTS' | 'SPORTS EVENTS' | 'CULTURAL EVENTS';
export type DbEventCategory = 'TECHNICAL' | 'SPORTS' | 'CULTURAL';
export type EventStatus = 'DRAFT' | 'UPCOMING' | 'ONGOING' | 'COMPLETED';

export interface SampleEvent {
  id: string;
  index?: string;
  title: string;
  subtitle?: string;
  description: string;
  year?: string;
  category?: DbEventCategory | EventCategoryType;
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
  created_at?: string;
  updated_at?: string;
}

export type EventItem = SampleEvent;
export type CmsEvent = SampleEvent;

export interface EventFormData {
  title: string;
  description: string;
  category: DbEventCategory;
  year: number | string;
  event_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  registration_url: string;
  cover_image_url: string;
  status: EventStatus;
  is_published: boolean;
  is_featured: boolean;
  display_order: number;
}

// ============================================================================
// COMMITTEE & PEOPLE TYPES
// ============================================================================
export type CommitteeTier = 'CORE' | 'TY_LEADERSHIP' | 'SY_COORDINATOR' | 'FACULTY';
export type CommitteeDomain =
  | 'OVERALL'
  | 'TECHNICAL'
  | 'ANCHORING'
  | 'MEDIA'
  | 'FINANCE'
  | 'SPORTS'
  | 'ALUMNI'
  | 'OPERATIONS';

export interface CommitteeMember {
  id: string;
  name: string;
  position: string;
  photo?: string;
  photo_url?: string | null;
  tier: CommitteeTier;
  domain?: CommitteeDomain | string | null;
  department?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  tenure_year?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface MemberFormData {
  name: string;
  position: string;
  tier: CommitteeTier;
  domain?: string | null;
  department?: string | null;
  photo_url?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  tenure_year?: string;
  display_order: number;
  is_active: boolean;
}

export interface Position {
  id: string;
  name: string;
  tier: CommitteeTier;
  domain?: CommitteeDomain | string | null;
  description?: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PositionFormData {
  name: string;
  tier: CommitteeTier;
  domain?: string | null;
  description?: string | null;
  display_order: number;
  is_active: boolean;
}

// ============================================================================
// ARCHIVE TYPES
// ============================================================================
export interface GalleryItem {
  id: string;
  index?: string;
  title: string;
  caption?: string;
  description?: string | null;
  year?: string | number | null;
  category?: string;
  image: string;
  image_url?: string;
  aspect?: 'wide' | 'tall' | 'square';
  meta?: string;
  event_name?: string | null;
  display_order?: number;
  is_published?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type ArchiveRecord = GalleryItem;

export interface ArchiveFormData {
  title?: string | null;
  description?: string | null;
  image_url: string;
  year?: number | string | null;
  event_name?: string | null;
  display_order: number;
  is_published: boolean;
}

// ============================================================================
// ANNOUNCEMENTS & SETTINGS TYPES
// ============================================================================
export interface Announcement {
  id: string;
  title: string;
  message?: string | null;
  link_url?: string | null;
  is_published: boolean;
  published_at?: string | null;
  expires_at?: string | null;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface AnnouncementFormData {
  title: string;
  message?: string | null;
  link_url?: string | null;
  is_published: boolean;
  published_at?: string | null;
  expires_at?: string | null;
  display_order: number;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: any;
  description?: string | null;
  is_public: boolean;
  updated_at?: string;
}

// ============================================================================
// AUTH & ADMIN PROFILE TYPES
// ============================================================================
export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR';

export interface AdminProfile {
  id: string;
  email: string;
  full_name?: string | null;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export * from './database';
