import type { User } from "@supabase/supabase-js";

export type AppRole = "user" | "admin";
export type ListingCategory = "rentals" | "ride-share" | "jobs" | "services" | "buy-sell";
export type ListingStatus = "active" | "flagged" | "removed";
export type ListingIntent = "offer" | "need";
export type RequestWindow = "today" | "this-week" | "flexible";
export type ListingPriceType =
  | "flat-rate"
  | "hourly"
  | "per-trip"
  | "per-day"
  | "per-week"
  | "per-month"
  | "contact";
export type ProfileVerificationStatus = "unverified" | "pending" | "verified";
export type BoostOrderStatus = "pending" | "active" | "expired" | "canceled" | "failed";
export type IdentityVerificationOrderStatus = "pending" | "paid" | "canceled" | "failed";
export type UserReportStatus = "open" | "resolved" | "dismissed";
export type JobShiftPattern =
  | "day-shift"
  | "night-shift"
  | "7-on-7-off"
  | "14-on-7-off"
  | "14-on-14-off"
  | "other";
export type JobWorkSetup = "local" | "camp" | "fifo" | "dido" | "hybrid";
export type JobPayBand = "under-25" | "25-35" | "35-50" | "50-plus" | "salary";
export type RentalParkingType = "none" | "street" | "stall" | "truck";
export type RentalAvailabilityType =
  | "immediate"
  | "from-date"
  | "short-term-worker-stay"
  | "rotation-friendly";
export type RentalLeasePattern = "month-to-month" | "weekly" | "rotation-stay" | "flexible";
export type RentalBestFor = "fifo-worker" | "shift-worker" | "crew-housing" | "single-occupant";
export type RideShareTripType = "one-time" | "recurring";
export type RideShareSchedulePattern =
  | "daily"
  | "weekdays"
  | "weekends"
  | "7-on-7-off"
  | "14-on-7-off"
  | "14-on-14-off"
  | "custom";
export type RideShareTimeWindow =
  | "early-morning"
  | "morning"
  | "midday"
  | "afternoon"
  | "evening"
  | "night";
export type FortMcMurrayArea =
  | "downtown"
  | "thickwood"
  | "dickinsfield"
  | "timberlea"
  | "eagle-ridge"
  | "stonecreek"
  | "parsons-creek"
  | "taiganova"
  | "wood-buffalo"
  | "abasand"
  | "beacon-hill"
  | "grayling-terrace"
  | "waterways"
  | "prairie-creek"
  | "gregoire"
  | "airport"
  | "draper"
  | "saprae-creek-estates"
  | "anzac"
  | "fort-mckay"
  | "gregoire-lake-estates";
export type RideShareArea =
  | FortMcMurrayArea
  | "site-camp"
  | "edmonton"
  | "calgary";
export type RideShareSiteCamp =
  | "cnrl-horizon"
  | "suncor-base-plant"
  | "mildred-lake"
  | "albian"
  | "fort-hills"
  | "syncrude"
  | "other";
export type BusinessDayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface BusinessHoursDay {
  closed?: boolean;
  open?: string | null;
  close?: string | null;
}

export type BusinessHours = Partial<Record<BusinessDayKey, BusinessHoursDay>>;

export interface JobListingStructuredData {
  shiftPattern?: JobShiftPattern | null;
  workSetup?: JobWorkSetup | null;
  payBand?: JobPayBand | null;
  ticketsRequired?: boolean;
}

export interface RentalListingStructuredData {
  rentalArea?: FortMcMurrayArea | null;
  availabilityType?: RentalAvailabilityType | null;
  availableFrom?: string | null;
  availableTo?: string | null;
  leasePattern?: RentalLeasePattern | null;
  bestFor?: RentalBestFor | null;
  nearbySite?: RideShareSiteCamp | null;
  furnished?: boolean;
  utilitiesIncluded?: boolean;
  shortTerm?: boolean;
  parkingType?: RentalParkingType | null;
}

export interface RideShareListingStructuredData {
  tripType?: RideShareTripType | null;
  departureArea?: RideShareArea | null;
  destinationArea?: RideShareArea | null;
  tripDate?: string | null;
  pickupWindow?: RideShareTimeWindow | null;
  returnWindow?: RideShareTimeWindow | null;
  schedulePattern?: RideShareSchedulePattern | null;
  siteCamp?: RideShareSiteCamp | null;
  startDate?: string | null;
  endDate?: string | null;
  ongoing?: boolean;
  seatsAvailable?: number | null;
  toolSpace?: boolean;
}

export type ListingStructuredData =
  | JobListingStructuredData
  | RentalListingStructuredData
  | RideShareListingStructuredData
  | Record<string, never>;

export interface Profile {
  id: string;
  email: string | null;
  full_name: string;
  phone: string | null;
  role: AppRole;
  is_business?: boolean | null;
  business_name?: string | null;
  business_description?: string | null;
  business_logo_url?: string | null;
  business_website?: string | null;
  business_address?: string | null;
  show_exact_business_location?: boolean | null;
  business_geocoded_lat?: number | null;
  business_geocoded_lng?: number | null;
  business_geocoded_area?: string | null;
  business_geocoded_formatted_address?: string | null;
  business_geocoded_at?: string | null;
  service_areas?: string[] | null;
  business_services?: string[] | null;
  business_hours?: BusinessHours | null;
  email_notifications?: boolean | null;
  verification_status?: ProfileVerificationStatus;
  verification_requested_at?: string | null;
  verified_at?: string | null;
  stripe_identity_verification_session_id?: string | null;
  stripe_identity_session_status?: string | null;
  stripe_identity_last_error_code?: string | null;
  stripe_identity_last_error_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: string;
  owner_id: string;
  storefront_id: string | null;
  title: string;
  slug: string;
  category: ListingCategory;
  listing_intent: ListingIntent;
  request_window: RequestWindow | null;
  description: string;
  price: number | null;
  price_type: ListingPriceType;
  location: string;
  show_exact_address_on_map: boolean | null;
  geocoded_lat: number | null;
  geocoded_lng: number | null;
  geocoded_area: string | null;
  geocoded_formatted_address: string | null;
  geocoded_at: string | null;
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
  structured_data: ListingStructuredData | null;
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
  extra_filters: Record<string, string | boolean> | null;
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

export interface IdentityVerificationOrder {
  id: string;
  user_id: string;
  amount_cents: number;
  currency: string;
  status: IdentityVerificationOrderStatus;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicSellerStorefront {
  seller_id: string;
  storefront_id: string | null;
  display_name: string;
  is_business: boolean;
  business_description: string | null;
  business_logo_url: string | null;
  business_website: string | null;
  business_address?: string | null;
  show_exact_business_location?: boolean | null;
  service_areas: string[];
  business_services: string[];
  business_hours: BusinessHours;
  phone: string | null;
  primary_location: string;
  total_active_listings: number;
  active_categories: ListingCategory[];
  listings: Listing[];
}

export interface AdditionalBusinessStorefront {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  show_exact_location: boolean;
  geocoded_lat: number | null;
  geocoded_lng: number | null;
  geocoded_area: string | null;
  geocoded_formatted_address: string | null;
  geocoded_at: string | null;
  service_areas: string[];
  services: string[];
  hours: BusinessHours;
  created_at: string;
  updated_at: string;
}

export interface BusinessMapProfile {
  storefront_id: string;
  owner_id: string;
  business_name: string | null;
  business_address: string | null;
  show_exact_business_location: boolean;
  business_geocoded_lat: number | null;
  business_geocoded_lng: number | null;
  business_geocoded_area: string | null;
  business_geocoded_formatted_address: string | null;
}

export interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  last_success_at: string | null;
  last_failure_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  conversation_id: string | null;
  reason: string | null;
  created_at: string;
}

export interface UserReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  conversation_id: string | null;
  listing_id: string | null;
  reason: string;
  status: UserReportStatus;
  created_at: string;
  updated_at: string;
}

export interface AppErrorLog {
  id: string;
  user_id: string | null;
  source: string;
  message: string;
  name: string | null;
  stack: string | null;
  pathname: string | null;
  user_agent: string | null;
  metadata: Record<string, string | number | boolean | null> | null;
  created_at: string;
}

export interface Viewer {
  user: User;
  profile: Profile;
}
