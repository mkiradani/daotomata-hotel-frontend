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

// CORRECTED: This now reflects the actual nested structure from the getAvailableRoomTypes endpoint.
// The top-level response contains a 'data' array of properties.
export interface CloudbedsAvailabilityProperty {
  propertyID: string;
  propertyCurrency?: {
    currencyCode: string;
    currencySymbol: string;
    currencyPosition: string;
  };
  propertyRooms: CloudbedsAvailableRoomType[];
}

// Each property then contains an array of available room types.
export interface CloudbedsAvailableRoomType {
  roomTypeID: string;
  roomTypeName: string;
  roomTypeNameShort: string;
  roomTypeDescription: string;
  maxGuests: number;
  adultsIncluded: number;
  childrenIncluded: number;
  roomTypePhotos: Array<{
    thumb: string;
    image: string;
  }>;
  roomRate: number;
  roomRateID: string;
  ratePlanNamePublic: string;
  ratePlanNamePrivate: string;
  roomsAvailable: number;
}

// The main availability response type.
export interface CloudbedsAvailabilityResponse extends CloudbedsBaseResponse {
  success: boolean;
  data?: CloudbedsAvailabilityProperty[];
  count?: number;
  total?: number;
}

// Room-related types (from getRooms)
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

export type CloudbedsRoomsListResponse =
  CloudbedsListResponse<CloudbedsRoomResponse>;

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

// Booking-related types - Updated to match Cloudbeds API v1.3 format
export interface CloudbedsBookingRequest {
  propertyID: string;
  startDate: string;
  endDate: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone?: string;
  guestCountry: string; // ISO-Code 2 characters
  rooms: Array<{ roomTypeID?: string }>;
  adults: Array<Record<string, unknown>>;
  children: Array<Record<string, unknown>>;
  paymentMethod: string;
  specialRequests?: string;
  promoCode?: string;
  sendEmailConfirmation?: boolean;
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

// Rate Plans response
export interface CloudbedsRatePlan {
  id: string | number;
  name: string;
  description?: string;
  rate_type: 'standard' | 'package' | 'promotional';
  currency: string;
  is_active: boolean;
  restrictions?: {
    min_stay?: number;
    max_stay?: number;
    advance_booking?: number;
    non_refundable?: boolean;
  };
  inclusions?: string[];
  // policies field removed as it's not part of the primary object
}

export interface CloudbedsRatePlansResponse extends CloudbedsBaseResponse {
  success: boolean;
  data: CloudbedsRatePlan[];
}

// Guest-related types
export interface CloudbedsGuestResponse {
  id: string | number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  };
  preferences?: {
    room_type?: string;
    floor_preference?: string;
    special_requests?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface CloudbedsGuestCreateRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  };
}

export type CloudbedsGuestListResponse =
  CloudbedsListResponse<CloudbedsGuestResponse>;

// CONSOLIDATED: Unified Payment-related types to avoid conflicts.
export interface CloudbedsCardType {
  cardCode: string;
  cardName: string;
}

export interface CloudbedsPaymentMethod {
  type: string;
  name: string;
  cardTypes?: CloudbedsCardType[];
}

export interface CloudbedsPaymentMethodResponse extends CloudbedsBaseResponse {
  success: boolean;
  data: {
    propertyID: string;
    methods: CloudbedsPaymentMethod[];
    gateway?: Array<{
      name: string;
      currency: string;
    }>;
  };
}

export interface CloudbedsPaymentRequest {
  reservation_id: string | number;
  amount: number;
  currency?: string; // Opcional según la API
  payment_method_id: string; // "cards", "visa", "master" según getPaymentMethods
  description?: string;
  guest_id?: string | number;
  // Nota: type = "credit" se añade automáticamente en el engine
}

export interface CloudbedsPaymentResponse extends CloudbedsBaseResponse {
  id: string | number;
  reservation_id: string | number;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  transaction_id?: string;
  processed_at?: string;
}

export interface CloudbedsChargeRequest {
  reservation_id: string | number;
  item_id?: string;
  description: string;
  amount: number;
  currency: string;
  category?: 'room' | 'tax' | 'fee' | 'service' | 'other';
}

export interface CloudbedsChargeResponse extends CloudbedsBaseResponse {
  id: string | number;
  reservation_id: string | number;
  description: string;
  amount: number;
  currency: string;
  category: string;
  created_at: string;
}

// Reservation Assignments types
export interface CloudbedsReservationAssignmentResponse {
  reservation_id: string | number;
  room_assignments: Array<{
    room_id: string | number;
    room_number?: string;
    room_type: string;
    guest_id?: string | number;
    check_in_date: string;
    check_out_date: string;
    rate_plan_id: string;
    rate_plan_name: string;
  }>;
}

// Generic API response type
export type CloudbedsApiResponse<T = unknown> = T extends CloudbedsBaseResponse
  ? T
  : CloudbedsBaseResponse & T;
