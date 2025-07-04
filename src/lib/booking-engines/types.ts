/**
 * Common types and interfaces for booking engines
 */

export interface BookingEngineConfig {
  type: 'cloudbeds' | 'booking.com' | 'expedia' | 'airbnb' | 'custom';
  credentials: {
    clientId?: string;
    clientSecret?: string;
    apiKey?: string;
    propertyId?: string;
    [key: string]: unknown;
  };
  settings?: {
    currency?: string;
    language?: string;
    timezone?: string;
    [key: string]: unknown;
  };
}

export interface RoomAvailability {
  roomId: string;
  roomType: string;
  available: boolean;
  price: number;
  currency: string;
  maxOccupancy: number;
  checkIn: string;
  checkOut: string;
  restrictions?: {
    minStay?: number;
    maxStay?: number;
    closedToArrival?: boolean;
    closedToDeparture?: boolean;
  };
}

export interface BookingRequest {
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  rooms?: number;
  roomType?: string;
  guestInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      country?: string;
      postalCode?: string;
    };
  };
  specialRequests?: string;
  promoCode?: string;
}

export interface BookingResponse {
  success: boolean;
  bookingId?: string;
  confirmationNumber?: string;
  totalAmount?: number;
  currency?: string;
  error?: string;
  details?: Record<string, unknown>;
}

export interface RateQuery {
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  rooms?: number;
  roomTypes?: string[];
}

export interface RoomRate {
  roomId: string;
  roomType: string;
  ratePlanId?: string;
  ratePlanName?: string;
  basePrice: number;
  totalPrice: number;
  currency: string;
  taxes?: number;
  fees?: number;
  discounts?: number;
  breakdown?: {
    [date: string]: {
      basePrice: number;
      taxes?: number;
      fees?: number;
    };
  };
}

/**
 * Common interface that all booking engines must implement
 */
export interface IBookingEngine {
  /**
   * Initialize the booking engine with configuration
   */
  initialize(config: BookingEngineConfig): Promise<void>;

  /**
   * Check room availability for given dates and criteria
   */
  checkAvailability(query: RateQuery): Promise<RoomAvailability[]>;

  /**
   * Get room rates for given dates and criteria
   */
  getRates(query: RateQuery): Promise<RoomRate[]>;

  /**
   * Create a new booking
   */
  createBooking(request: BookingRequest): Promise<BookingResponse>;

  /**
   * Get booking details by ID
   */
  getBooking(bookingId: string): Promise<Record<string, unknown>>;

  /**
   * Cancel a booking
   */
  cancelBooking(bookingId: string, reason?: string): Promise<BookingResponse>;

  /**
   * Modify an existing booking
   */
  modifyBooking(bookingId: string, changes: Partial<BookingRequest>): Promise<BookingResponse>;

  /**
   * Get property information
   */
  getPropertyInfo(): Promise<Record<string, unknown>>;

  /**
   * Validate booking engine configuration
   */
  validateConfig(config: BookingEngineConfig): boolean;

  /**
   * Get supported features for this booking engine
   */
  getSupportedFeatures(): string[];
}

/**
 * Booking engine factory interface
 */
export interface IBookingEngineFactory {
  createEngine(type: BookingEngineConfig['type']): IBookingEngine;
  getSupportedEngines(): BookingEngineConfig['type'][];
}

/**
 * Error types for booking operations
 */
export class BookingEngineError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'BookingEngineError';
  }
}

export class ConfigurationError extends BookingEngineError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', details);
    this.name = 'ConfigurationError';
  }
}

export class AvailabilityError extends BookingEngineError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'AVAILABILITY_ERROR', details);
    this.name = 'AvailabilityError';
  }
}

export class BookingError extends BookingEngineError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'BOOKING_ERROR', details);
    this.name = 'BookingError';
  }
}
