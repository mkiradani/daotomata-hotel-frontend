/**
 * Cloudbeds API response types based on official API documentation
 */

// Base response schemas from Cloudbeds API
export interface CloudbedsBaseResponse {
  [key: string]: unknown; // Allow index signature for compatibility
  message?: string;
}

export interface CloudbedsErrorResponse extends CloudbedsBaseResponse {
  errors?: Array<{
    var_field: string;
    message: string;
  }>;
}

export interface CloudbedsListResponse<T> extends CloudbedsBaseResponse {
  offset?: number;
  limit?: number;
  total?: number;
  data: T[];
}

// Room-related types
export interface CloudbedsRoomResponse {
  id: string | number;
  name: string;
  type: string;
  description?: string;
  max_occupancy?: number;
  bed_configuration?: string;
  size_sqm?: number;
  amenities?: string[];
  is_accessible?: boolean;
  available?: boolean;
  currency?: string;
  restrictions?: {
    min_stay?: number;
    max_stay?: number;
    closed_to_arrival?: boolean;
    closed_to_departure?: boolean;
  };
}

export interface CloudbedsRoomsListResponse extends CloudbedsListResponse<CloudbedsRoomResponse> { }

// Availability-related types
export interface CloudbedsAvailabilityResponse extends CloudbedsBaseResponse {
  rooms: CloudbedsRoomResponse[];
  property_id?: string;
  start_date?: string;
  end_date?: string;
}

// Rate-related types
export interface CloudbedsRateResponse {
  room_id: string | number;
  room_type: string;
  rate_plan_id: string;
  rate_plan_name: string;
  base_rate: number;
  total_rate: number;
  currency: string;
  date: string;
  taxes?: number;
  fees?: number;
  discounts?: number;
}

export interface CloudbedsRatesResponse extends CloudbedsBaseResponse {
  rates: CloudbedsRateResponse[];
}

// Booking-related types
export interface CloudbedsBookingRequest {
  start_date: string;
  end_date: string;
  adults: number;
  children?: number;
  rooms?: number;
  room_type_id?: string;
  rate_plan_id?: string;
  guest_first_name?: string;
  guest_last_name?: string;
  guest_email?: string;
  guest_phone?: string;
  special_requests?: string;
  promo_code?: string;
}

export interface CloudbedsBookingResponse extends CloudbedsBaseResponse {
  id: string | number;
  reservation_id?: string;
  status: string;
  start_date: string;
  end_date: string;
  adults: number;
  children?: number;
  rooms: number;
  total_amount: number;
  currency: string;
  guest_info?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  room_assignments?: Array<{
    room_id: string;
    room_type: string;
    rate_plan_id: string;
  }>;
}

// Property-related types
export interface CloudbedsPropertyResponse extends CloudbedsBaseResponse {
  id: string | number;
  name: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  };
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  settings?: {
    currency?: string;
    timezone?: string;
    language?: string;
  };
  amenities?: string[];
  policies?: {
    check_in_time?: string;
    check_out_time?: string;
    cancellation_policy?: string;
  };
}

// Diagnostic types
export interface CloudbedsDiagnosticResponse extends CloudbedsBaseResponse {
  success: boolean;
  property_id?: string;
  api_status: 'connected' | 'error' | 'unauthorized';
  rooms_count?: number;
  last_sync?: string;
  error?: string;
  details?: {
    auth_status: boolean;
    property_access: boolean;
    rooms_accessible: boolean;
    rates_accessible: boolean;
  };
}

// Request options type
export interface CloudbedsRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string | FormData;
  params?: Record<string, string | number | boolean>;
}

// Generic API response type
export type CloudbedsApiResponse<T = unknown> = T extends CloudbedsBaseResponse
  ? T
  : CloudbedsBaseResponse & T;
