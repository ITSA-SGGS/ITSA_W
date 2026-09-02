export type Theme = 'dark' | 'light';

export interface SampleEvent {
  id: string;
  index: string;
  title: string;
  subtitle: string;
  description: string;
  year: string;
}

export type EventCategoryType = 'TECHNICAL EVENTS' | 'SPORTS EVENTS' | 'CULTURAL EVENTS';

export interface CommitteeMember {
  id: string;
  name: string;
  position: string;
  photo: string;
  tier: 'CORE' | 'TY_LEADERSHIP' | 'SY_COORDINATOR' | 'FACULTY';
  domain?: 'OVERALL' | 'TECHNICAL' | 'ANCHORING' | 'MEDIA' | 'FINANCE' | 'SPORTS' | 'ALUMNI' | 'OPERATIONS';
}

export interface GalleryItem {
  id: string;
  title: string;
  caption: string;
  year: string;
  category: string;
  image: string;
  aspect: 'wide' | 'tall' | 'square';
  meta: string;
}
