/**
 * Cloudbeds utilities for URL generation and booking engine helpers
 * Supports both API mode and redirect mode for flexible booking flows
 */

export interface CloudbedsUrlParams {
  checkIn: string; // YYYY-MM-DD format
  checkOut: string; // YYYY-MM-DD format
  adults: number;
  children?: number;
  rooms?: number;
  currency?: string; // ISO-4217 format (eur, usd, etc.)
  language?: string; // Language code (en, es, fr, etc.)
  promoCode?: string;
}

export interface CloudbedsUrlConfig {
  propertyUrlId: string; // Unique property ID for URL (e.g., 'lmKzDQ')
  baseUrl?: string; // Default: 'https://hotels.cloudbeds.com'
  defaultLanguage?: string; // Default: 'en'
  defaultCurrency?: string; // Default: 'eur'
}

/**
 * Build Cloudbeds booking engine URL for redirect mode
 *
 * Example output:
 * https://hotels.cloudbeds.com/en/reservas/lmKzDQ?checkin=2025-07-30&checkout=2025-08-06&adults=1&kids=3&currency=eur
 *
 * @param config - Cloudbeds URL configuration
 * @param params - Booking parameters
 * @returns Complete booking URL for redirect
 */
export function buildCloudbedsUrl(
  config: CloudbedsUrlConfig,
  params: CloudbedsUrlParams
): string {
  const {
    propertyUrlId,
    baseUrl = 'https://hotels.cloudbeds.com',
    defaultLanguage = 'en',
    defaultCurrency = 'eur',
  } = config;

  const {
    checkIn,
    checkOut,
    adults,
    children,
    rooms,
    currency = defaultCurrency,
    language = defaultLanguage,
    promoCode,
  } = params;

  // Validate required parameters
  if (!propertyUrlId) {
    throw new Error('Property URL ID is required for Cloudbeds booking URL');
  }
  if (!checkIn || !checkOut) {
    throw new Error('Check-in and check-out dates are required');
  }
  if (!adults || adults < 1) {
    throw new Error('At least 1 adult is required');
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(checkIn) || !dateRegex.test(checkOut)) {
    throw new Error('Dates must be in YYYY-MM-DD format');
  }

  // Build base URL path
  const urlPath = `/${language}/reservas/${propertyUrlId}`;

  // Build query parameters
  const queryParams = new URLSearchParams({
    checkin: checkIn,
    checkout: checkOut,
    adults: adults.toString(),
    currency: currency.toLowerCase(),
  });

  // Add optional parameters
  if (children && children > 0) {
    queryParams.append('kids', children.toString());
  }

  if (rooms && rooms > 1) {
    queryParams.append('rooms', rooms.toString());
  }

  if (promoCode) {
    queryParams.append('promoCode', promoCode);
  }

  // Construct final URL
  const finalUrl = `${baseUrl}${urlPath}?${queryParams.toString()}`;

  console.log('🔗 [CLOUDBEDS-UTILS] Generated booking URL:', finalUrl);

  return finalUrl;
}

/**
 * Extract property URL ID from hotel configuration
 * Looks for cloudbeds_booking_url_id field in hotel data
 *
 * @param hotelData - Hotel configuration object
 * @returns Property URL ID or null if not found
 */
export function extractPropertyUrlId(
  hotelData: Record<string, unknown>
): string | null {
  const urlId = hotelData.cloudbeds_booking_url_id;

  if (typeof urlId === 'string' && urlId.trim()) {
    return urlId.trim();
  }

  return null;
}

/**
 * Determine if hotel should use redirect mode vs API mode
 * Based on presence of booking URL ID and configuration
 *
 * @param hotelData - Hotel configuration object
 * @returns true if should use redirect mode, false for API mode
 */
export function shouldUseRedirectMode(
  hotelData: Record<string, unknown>
): boolean {
  // Check if hotel has booking URL ID configured
  const hasUrlId = !!extractPropertyUrlId(hotelData);

  // Check if hotel has explicit redirect mode flag
  const redirectMode = hotelData.cloudbeds_redirect_mode;

  // Use redirect mode if URL ID is present and redirect mode is not explicitly disabled
  return hasUrlId && redirectMode !== false;
}

/**
 * Validate Cloudbeds URL parameters
 *
 * @param params - Parameters to validate
 * @returns Validation result with errors if any
 */
export function validateCloudbedsUrlParams(params: CloudbedsUrlParams): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check required fields
  if (!params.checkIn) {
    errors.push('Check-in date is required');
  }
  if (!params.checkOut) {
    errors.push('Check-out date is required');
  }
  if (!params.adults || params.adults < 1) {
    errors.push('At least 1 adult is required');
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (params.checkIn && !dateRegex.test(params.checkIn)) {
    errors.push('Check-in date must be in YYYY-MM-DD format');
  }
  if (params.checkOut && !dateRegex.test(params.checkOut)) {
    errors.push('Check-out date must be in YYYY-MM-DD format');
  }

  // Validate date logic
  if (params.checkIn && params.checkOut) {
    const checkInDate = new Date(params.checkIn);
    const checkOutDate = new Date(params.checkOut);

    if (checkInDate >= checkOutDate) {
      errors.push('Check-out date must be after check-in date');
    }
  }

  // Validate numeric fields
  if (params.children && params.children < 0) {
    errors.push('Number of children cannot be negative');
  }
  if (params.rooms && params.rooms < 1) {
    errors.push('Number of rooms must be at least 1');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Convert booking request to Cloudbeds URL parameters
 * Maps from internal BookingRequest format to CloudbedsUrlParams
 *
 * @param request - Internal booking request
 * @returns Cloudbeds URL parameters
 */
export function bookingRequestToUrlParams(request: {
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  rooms?: number;
  promoCode?: string;
}): CloudbedsUrlParams {
  return {
    checkIn: request.checkIn,
    checkOut: request.checkOut,
    adults: request.adults,
    children: request.children,
    rooms: request.rooms,
    promoCode: request.promoCode,
  };
}
