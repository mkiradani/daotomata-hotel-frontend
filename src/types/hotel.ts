/**
 * Hotel type definitions for the daotomata hotel frontend
 */

export interface HotelBase {
  [key: string]: unknown; // Allow index signature for compatibility
  id: number;
  name: string;
  domain: string;
  status: 'published' | 'draft';
  pms_type?: 'cloudbeds' | 'booking.com' | 'expedia' | 'airbnb' | 'custom';

  // Localization
  avaliable_currencies?: string[];
  avaliable_lenguages?: number[];
  default_currency?: string;
  default_language?: string;
  available_languages?: string[];
  available_currencies?: string[];

  // Cloudbeds configuration
  cloudbeds_client_id?: string;
  cloudbeds_client_secret?: string;
  cloudbeds_api_key?: string;
  cloudbeds_property_id?: string;

  // Analytics and tracking
  chatwoot_website_token?: string;
  ga4_token?: string;
  meta_pixel_token?: string;

  // Contact information
  contact_email?: string;
  contact_phone_calls?: string;
  contact_phone_messages?: string;
  location?: string;

  // Theme and branding
  theme?: Record<string, unknown>;
  logo?: {
    id: string;
    filename_disk: string;
    title: string;
  } | null;
}

export interface Room {
  [key: string]: unknown; // Allow index signature for compatibility
  id: string;
  name: string;
  description?: string;
  cloudbeds_room_id?: string;
  pms_room_id?: string;
  room_type?: string;
  bed_configuration?: string;
  size_sqm?: number;
  max_occupancy?: number;
  amenities?: string[];
  is_accesible?: boolean;
  main_photo?: {
    id: string;
    filename_disk: string;
    title: string;
  };
  main_video?: {
    id: string;
    filename_disk: string;
    title: string;
  };
  media_gallery?: Array<{
    directus_files_id: {
      id: string;
      filename_disk: string;
      title: string;
    };
  }>;
}

export interface Activity {
  id: string;
  name: string;
  description?: string;
  price?: number;
  duration?: string;
  capacity?: number;
  age_restriction?: string;
  main_photo?: {
    id: string;
    filename_disk: string;
    title: string;
  };
  main_video?: {
    id: string;
    filename_disk: string;
    title: string;
  };
}

export interface Facility {
  id: string;
  name: string;
  description?: string;
  capacity?: number;
  operating_hours?: string;
  booking_requiered?: boolean;
  price?: number;
  amenities?: string[];
  age_restriction?: string;
  is_accessible?: boolean;
  main_photo?: {
    id: string;
    filename_disk: string;
    title: string;
  };
  main_video?: {
    id: string;
    filename_disk: string;
    title: string;
  };
}

export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  cuisine_type?: string;
  operating_hours?: string;
  capacity?: number;
  price_range?: string;
}

export interface Dish {
  id: string;
  name: string;
  description?: string;
  price?: number;
  category?: string;
  allergens?: string[];
  is_vegetarian?: boolean;
  is_vegan?: boolean;
}

export interface Gallery {
  id: string;
  name?: string;
  type?: string;
}

export interface HeroMedia {
  id: string;
  type?: string;
}

/**
 * Complete hotel object with all related data
 */
export interface Hotel extends HotelBase {
  rooms: Room[];
  activities: Activity[];
  facilities: Facility[];
  galleries: Gallery[];
  hero_media: HeroMedia[];
  restaurant: Restaurant | null;
  dishes: Dish[];
  analytics?: Record<string, unknown>;
}

/**
 * Hotel object as returned by getHotelByDomain function
 */
export type HotelData = Hotel;

/**
 * Simplified hotel object for API responses
 */
export interface HotelSummary {
  id: number;
  name: string;
  domain: string;
}
