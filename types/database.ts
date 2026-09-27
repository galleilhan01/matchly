export type AccountType = "brand" | "creator" | "admin";

export type CampaignStatus = "draft" | "published" | "in_progress" | "completed" | "archived";
export type ApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn";
export type MissionStatus =
  | "accepted"
  | "in_production"
  | "video_submitted"
  | "revision_requested"
  | "validated"
  | "completed";
export type Platform = "tiktok" | "instagram" | "youtube";
export type ContentType =
  | "ugc"
  | "face_camera"
  | "voice_over"
  | "unboxing"
  | "product_test"
  | "lifestyle"
  | "other";

export interface Profile {
  id: string;
  account_type: AccountType;
  full_name: string;
  avatar_url: string | null;
  is_verified: boolean;
  is_suspended: boolean;
  created_at: string;
}

export interface BrandProfile {
  profile_id: string;
  company_name: string;
  website: string | null;
  industry: string | null;
  description: string | null;
  logo_url: string | null;
}

export interface CreatorProfile {
  profile_id: string;
  bio: string | null;
  country: string | null;
  city: string | null;
  categories: string[];
  content_types: ContentType[];
  base_rate_cents: number | null;
  currency: string;
}

export interface Campaign {
  id: string;
  brand_id: string;
  title: string;
  raw_brief: string | null;
  ai_generated: boolean;
  platform: Platform | null;
  content_type: ContentType | null;
  country: string | null;
  language: string | null;
  target_age_min: number | null;
  target_age_max: number | null;
  niche: string | null;
  creators_needed: number;
  budget_per_video_cents: number;
  currency: string;
  deliverables: string | null;
  deadline: string | null;
  status: CampaignStatus;
  created_at: string;
}

// Type minimal généré manuellement le temps de lancer
// `supabase gen types typescript` en pointant vers ton propre projet,
// qui produira la définition complète (recommandé avant la mise en prod).
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      brand_profiles: { Row: BrandProfile; Insert: Partial<BrandProfile>; Update: Partial<BrandProfile> };
      creator_profiles: { Row: CreatorProfile; Insert: Partial<CreatorProfile>; Update: Partial<CreatorProfile> };
      campaigns: { Row: Campaign; Insert: Partial<Campaign>; Update: Partial<Campaign> };
    };
  };
}
