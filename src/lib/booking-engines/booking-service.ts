/**
 * Booking service - High-level API for booking operations
 */

import { CloudbedsEngine } from './cloudbeds-engine';
import { createBookingEngineForHotel, hasBookingCapabilities } from './factory';
import type { DirectusRoom } from './room-mapping-service';
import type {
  BookingRequest,
  BookingResponse,
  IBookingEngine,
  RateQuery,
  RoomAvailability,
  RoomRate,
} from './types';
import { ConfigurationError } from './types';

export class BookingService {
  private engines: Map<string, IBookingEngine> = new Map();

  /**
   * Initialize booking service for a hotel
   */
  async initializeForHotel(hotelData: Record<string, unknown>): Promise<void> {
    if (!hasBookingCapabilities(hotelData)) {
      throw new ConfigurationError(
        `Hotel ${hotelData.name} does not have booking capabilities configured`
      );
    }

    const engine = await createBookingEngineForHotel(hotelData);

    // If it's a Cloudbeds engine, set the Directus rooms for mapping
    if (engine instanceof CloudbedsEngine && hotelData.rooms) {
      const directusRooms = hotelData.rooms as DirectusRoom[];
      engine.setDirectusRooms(directusRooms);
    }

    this.engines.set(String(hotelData.id), engine);
  }

  /**
   * Get booking engine for a hotel
   */
  private getEngine(hotelId: string): IBookingEngine {
    const engine = this.engines.get(hotelId);
    if (!engine) {
      throw new ConfigurationError(`No booking engine initialized for hotel ${hotelId}`);
    }
    return engine;
  }

  /**
   * Check room availability for a hotel
   */
  async checkAvailability(hotelId: string, query: RateQuery): Promise<RoomAvailability[]> {
    const engine = this.getEngine(hotelId);
    return await engine.checkAvailability(query);
  }

  /**
   * Get room rates for a hotel
   */
  async getRates(hotelId: string, query: RateQuery): Promise<RoomRate[]> {
    const engine = this.getEngine(hotelId);
    return await engine.getRates(query);
  }

  /**
   * Create a booking for a hotel
   */
  async createBooking(hotelId: string, request: BookingRequest): Promise<BookingResponse> {
    const engine = this.getEngine(hotelId);
    return await engine.createBooking(request);
  }

  /**
   * Get booking details
   */
  async getBooking(hotelId: string, bookingId: string): Promise<Record<string, unknown>> {
    const engine = this.getEngine(hotelId);
    return await engine.getBooking(bookingId);
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(
    hotelId: string,
    bookingId: string,
    reason?: string
  ): Promise<BookingResponse> {
    const engine = this.getEngine(hotelId);
    return await engine.cancelBooking(bookingId, reason);
  }

  /**
   * Modify a booking
   */
  async modifyBooking(
    hotelId: string,
    bookingId: string,
    changes: Partial<BookingRequest>
  ): Promise<BookingResponse> {
    const engine = this.getEngine(hotelId);
    return await engine.modifyBooking(bookingId, changes);
  }

  /**
   * Get property information
   */
  async getPropertyInfo(hotelId: string): Promise<Record<string, unknown>> {
    const engine = this.getEngine(hotelId);
    return await engine.getPropertyInfo();
  }

  /**
   * Get supported features for a hotel's booking engine
   */
  getSupportedFeatures(hotelId: string): string[] {
    const engine = this.getEngine(hotelId);
    return engine.getSupportedFeatures();
  }

  /**
   * Get room mapping statistics for a hotel (Cloudbeds only)
   */
  getRoomMappingStats(
    hotelId: string
  ): ReturnType<typeof CloudbedsEngine.prototype.getRoomMappingStats> | null {
    const engine = this.getEngine(hotelId);
    if (engine instanceof CloudbedsEngine) {
      return engine.getRoomMappingStats();
    }
    return null;
  }

  /**
   * Get mapped rooms for a hotel (Cloudbeds only)
   */
  getMappedRooms(
    hotelId: string
  ): ReturnType<typeof CloudbedsEngine.prototype.getMappedRooms> | null {
    const engine = this.getEngine(hotelId);
    if (engine instanceof CloudbedsEngine) {
      return engine.getMappedRooms();
    }
    return null;
  }

  /**
   * Check if a hotel supports a specific feature
   */
  supportsFeature(hotelId: string, feature: string): boolean {
    try {
      const features = this.getSupportedFeatures(hotelId);
      return features.includes(feature);
    } catch {
      return false;
    }
  }

  /**
   * Get availability and rates in a single call (optimization)
   */
  async getAvailabilityAndRates(
    hotelId: string,
    query: RateQuery
  ): Promise<{
    availability: RoomAvailability[];
    rates: RoomRate[];
  }> {
    const engine = this.getEngine(hotelId);

    // Run both queries in parallel for better performance
    const [availability, rates] = await Promise.all([
      engine.checkAvailability(query),
      engine.getRates(query),
    ]);

    return { availability, rates };
  }

  /**
   * Validate booking request before submission
   */
  validateBookingRequest(request: BookingRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!request.checkIn) errors.push('Check-in date is required');
    if (!request.checkOut) errors.push('Check-out date is required');
    if (!request.adults || request.adults < 1) errors.push('At least one adult is required');

    // Date validation
    if (request.checkIn && request.checkOut) {
      const checkIn = new Date(request.checkIn);
      const checkOut = new Date(request.checkOut);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (checkIn < today) errors.push('Check-in date cannot be in the past');
      if (checkOut <= checkIn) errors.push('Check-out date must be after check-in date');
    }

    // Guest info validation
    if (request.guestInfo) {
      if (!request.guestInfo.firstName) errors.push('Guest first name is required');
      if (!request.guestInfo.lastName) errors.push('Guest last name is required');
      if (!request.guestInfo.email) errors.push('Guest email is required');

      // Email format validation
      if (request.guestInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.guestInfo.email)) {
        errors.push('Invalid email format');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format price for display
   */
  formatPrice(amount: number, currency: string, locale?: string): string {
    try {
      return new Intl.NumberFormat(locale || 'en-US', {
        style: 'currency',
        currency,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  }

  /**
   * Calculate number of nights between dates
   */
  calculateNights(checkIn: string, checkOut: string): number {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get booking summary for display
   */
  getBookingSummary(
    request: BookingRequest,
    rates: RoomRate[]
  ): {
    nights: number;
    totalGuests: number;
    estimatedTotal: number;
    currency: string;
  } {
    const nights = this.calculateNights(request.checkIn, request.checkOut);
    const totalGuests = request.adults + (request.children || 0);

    // Calculate estimated total from rates
    const estimatedTotal = rates.reduce((sum, rate) => sum + rate.totalPrice, 0);
    const currency = rates[0]?.currency || 'USD';

    return {
      nights,
      totalGuests,
      estimatedTotal,
      currency,
    };
  }
}

// Singleton instance
let bookingServiceInstance: BookingService | null = null;

/**
 * Get the booking service singleton instance
 */
export const getBookingService = (): BookingService => {
  if (!bookingServiceInstance) {
    bookingServiceInstance = new BookingService();
  }
  return bookingServiceInstance;
};
