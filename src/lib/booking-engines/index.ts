/**
 * Booking engines module - Unified interface for multiple booking systems
 */

// Service
export { BookingService, getBookingService } from './booking-service';
// Engines
export { CloudbedsEngine } from './cloudbeds-engine';
// Factory
export {
  BookingEngineFactory,
  createBookingEngineForHotel,
  getBookingEngineFactory,
  hasBookingCapabilities,
} from './factory';
// Room mapping
export {
  type CloudbedsRoom,
  type DirectusRoom,
  type MappedRoom,
  RoomMappingService,
} from './room-mapping-service';
// Types and interfaces
export type {
  BookingEngineConfig,
  BookingRequest,
  BookingResponse,
  IBookingEngine,
  IBookingEngineFactory,
  RateQuery,
  RoomAvailability,
  RoomRate,
} from './types';
// Error classes
export {
  AvailabilityError,
  BookingEngineError,
  BookingError,
  ConfigurationError,
} from './types';

// Import types for convenience functions
import type { BookingRequest, RateQuery } from './types';

// Convenience functions for common operations
export const BookingEngines = {
  // Initialize booking for a hotel
  async initializeForHotel(hotelData: Record<string, unknown>) {
    const { getBookingService } = await import('./booking-service');
    const service = getBookingService();
    await service.initializeForHotel(hotelData);
    return service;
  },

  // Quick availability check
  async checkAvailability(hotelId: string, query: RateQuery) {
    const { getBookingService } = await import('./booking-service');
    const service = getBookingService();
    return await service.checkAvailability(hotelId, query);
  },

  // Quick rates check
  async getRates(hotelId: string, query: RateQuery) {
    const { getBookingService } = await import('./booking-service');
    const service = getBookingService();
    return await service.getRates(hotelId, query);
  },

  // Quick booking creation
  async createBooking(hotelId: string, request: BookingRequest) {
    const { getBookingService } = await import('./booking-service');
    const service = getBookingService();
    return await service.createBooking(hotelId, request);
  },

  // Check if hotel has booking capabilities
  async hasBookingCapabilities(hotelData: Record<string, unknown>) {
    const { hasBookingCapabilities: hasCapabilities } = await import(
      './factory'
    );
    return hasCapabilities(hotelData);
  },

  // Format price for display
  async formatPrice(amount: number, currency: string, locale?: string) {
    const { getBookingService } = await import('./booking-service');
    const service = getBookingService();
    return service.formatPrice(amount, currency, locale);
  },

  // Validate booking request
  async validateBookingRequest(request: BookingRequest) {
    const { getBookingService } = await import('./booking-service');
    const service = getBookingService();
    return service.validateBookingRequest(request);
  },

  // Get room mapping stats
  async getRoomMappingStats(hotelId: string) {
    const { getBookingService } = await import('./booking-service');
    const service = getBookingService();
    return service.getRoomMappingStats(hotelId);
  },

  // Get mapped rooms
  async getMappedRooms(hotelId: string) {
    const { getBookingService } = await import('./booking-service');
    const service = getBookingService();
    return service.getMappedRooms(hotelId);
  },
};
