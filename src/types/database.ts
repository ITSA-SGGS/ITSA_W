export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: 'TECHNICAL' | 'SPORTS' | 'CULTURAL';
          year: number | null;
          event_date: string | null;
          start_time: string | null;
          end_time: string | null;
          venue: string | null;
          registration_url: string | null;
          cover_image_url: string | null;
          status: 'DRAFT' | 'UPCOMING' | 'ONGOING' | 'COMPLETED';
          is_published: boolean;
          is_featured: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          category: 'TECHNICAL' | 'SPORTS' | 'CULTURAL';
          year?: number | null;
          event_date?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          venue?: string | null;
          registration_url?: string | null;
          cover_image_url?: string | null;
          status?: 'DRAFT' | 'UPCOMING' | 'ONGOING' | 'COMPLETED';
          is_published?: boolean;
          is_featured?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          category?: 'TECHNICAL' | 'SPORTS' | 'CULTURAL';
          year?: number | null;
          event_date?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          venue?: string | null;
          registration_url?: string | null;
          cover_image_url?: string | null;
          status?: 'DRAFT' | 'UPCOMING' | 'ONGOING' | 'COMPLETED';
          is_published?: boolean;
          is_featured?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      positions: {
        Row: {
          id: string;
          name: string;
          tier: 'CORE' | 'TY_LEADERSHIP' | 'SY_COORDINATOR' | 'FACULTY';
          domain: string | null;
          description: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          tier: 'CORE' | 'TY_LEADERSHIP' | 'SY_COORDINATOR' | 'FACULTY';
          domain?: string | null;
          description?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          tier?: 'CORE' | 'TY_LEADERSHIP' | 'SY_COORDINATOR' | 'FACULTY';
          domain?: string | null;
          description?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      committee_members: {
        Row: {
          id: string;
          name: string;
          position: string;
          tier: 'CORE' | 'TY_LEADERSHIP' | 'SY_COORDINATOR' | 'FACULTY';
          domain: string | null;
          photo_url: string | null;
          linkedin_url: string | null;
          github_url: string | null;
          tenure_year: string;
          department: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          position: string;
          tier: 'CORE' | 'TY_LEADERSHIP' | 'SY_COORDINATOR' | 'FACULTY';
          domain?: string | null;
          photo_url?: string | null;
          linkedin_url?: string | null;
          github_url?: string | null;
          tenure_year?: string;
          department?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          position?: string;
          tier?: 'CORE' | 'TY_LEADERSHIP' | 'SY_COORDINATOR' | 'FACULTY';
          domain?: string | null;
          photo_url?: string | null;
          linkedin_url?: string | null;
          github_url?: string | null;
          tenure_year?: string;
          department?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      archive_records: {
        Row: {
          id: string;
          title: string | null;
          description: string | null;
          image_url: string;
          year: number | null;
          event_name: string | null;
          display_order: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title?: string | null;
          description?: string | null;
          image_url: string;
          year?: number | null;
          event_name?: string | null;
          display_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string | null;
          description?: string | null;
          image_url?: string;
          year?: number | null;
          event_name?: string | null;
          display_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          message: string | null;
          link_url: string | null;
          is_published: boolean;
          published_at: string | null;
          expires_at: string | null;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          message?: string | null;
          link_url?: string | null;
          is_published?: boolean;
          published_at?: string | null;
          expires_at?: string | null;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          message?: string | null;
          link_url?: string | null;
          is_published?: boolean;
          published_at?: string | null;
          expires_at?: string | null;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      site_settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          description: string | null;
          is_public: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: Json;
          description?: string | null;
          is_public?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: Json;
          description?: string | null;
          is_public?: boolean;
          updated_at?: string;
        };
      };
    };
  };
}
