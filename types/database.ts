import type { User } from "@supabase/supabase-js";

export type AppRole = "user" | "admin";
export type ListingCategory = "rentals" | "ride-share" | "jobs" | "services" | "buy-sell";
export type ListingStatus = "active" | "flagged" | "removed";
export type ProfileVerificationStatus = "unverified" | "pending" | "verified";
export type BoostOrderStatus = "pending" | "active" | "expired" | "canceled" | "failed";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string;
  phone: string | null;
  role: AppRole;
  email_notifications?: boolean | null;
  verification_status?: ProfileVerificationStatus;
  verification_requested_at?: string | null;
  verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: string;
  owner_id: string;
  title: string;
  slug: string;
  category: ListingCategory;
  description: string;
  price: number | null;
  location: string;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;

  // ✅ MAIN IMAGE (cover)
  image_url: string | null;

  // ✅ NEW: MULTIPLE IMAGES
  image_urls: string[] | null;

  is_featured: boolean;
  featured_until: string | null;
  boosted_at: string | null;
  boosted_until: string | null;
  is_urgent: boolean;
  urgent_until: string | null;
  stripe_checkout_session_id: string | null;
  status: ListingStatus;
  flag_count: number;
  created_at: string;
  updated_at: string;
  subcategory: string | null;
}

export interface ListingFlag {
  id: string;
  listing_id: string;
  reporter_id: string;
  reason: string;
  created_at: string;
}

export interface FlaggedListing extends Listing {
  listing_flags: ListingFlag[];
}

export interface SavedSearch {
  id: string;
  user_id: string;
  path: string;
  search_query: string | null;
  category: ListingCategory | null;
  subcategory: string | null;
  min_price: number | null;
  max_price: number | null;
  sort: string | null;
  signature: string;
  last_checked_at: string;
  created_at: string;
  updated_at: string;
}

export interface SellerReview {
  id: string;
  seller_id: string;
  reviewer_id: string;
  listing_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface SellerTrustSummary {
  seller_id: string;
  verification_status: ProfileVerificationStatus;
  verified_at: string | null;
  average_rating: number | null;
  review_count: number;
  top_rated: boolean;
  member_since: string;
}

export interface ListingBoostOrder {
  id: string;
  listing_id: string;
  owner_id: string;
  product_key: string;
  product_name: string;
  product_description: string | null;
  amount_cents: number;
  currency: string;
  status: BoostOrderStatus;
  provider: "stripe" | "demo" | "manual";
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  applied_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Viewer {
  user: User;
  profile: Profile;
}
