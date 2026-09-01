export type Theme = 'dark' | 'light';

export interface EventItem {
  id: string;
  year: string;
  date: string;
  monthDay: string;
  title: string;
  tagline: string;
  description: string;
  category: 'SYMPOSIUM' | 'WORKSHOP' | 'HACKATHON' | 'BOOTCAMP' | 'COMPETITION';
  location: string;
  attendees: string;
  image: string;
  status: 'UPCOMING' | 'COMPLETED';
  tags: string[];
  schedule?: { time: string; activity: string }[];
  speakers?: { name: string; role: string; org: string }[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: 'TY_EXECUTIVE' | 'SY_COORDINATOR' | 'ADVISOR';
  subRole?: string;
  avatar?: string;
  github?: string;
  linkedin?: string;
  bio?: string;
  skills?: string[];
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

export interface FocusArea {
  id: string;
  index: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  metrics: string;
  image: string;
}
