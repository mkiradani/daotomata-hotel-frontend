/**
 * Booking engines module - Unified interface for multiple booking systems
 */

// Types and interfaces
export type {
  BookingEngineConfig,
  RoomAvailability,
  BookingRequest,
  BookingResponse,
  RateQuery,
  RoomRate,
  IBookingEngine,
  IBookingEngineFactory,
} from './types';

// Error classes
export { BookingEngineError, ConfigurationError, AvailabilityError, BookingError } from './types';

// Engines
export { CloudbedsEngine } from './cloudbeds-engine';

// Factory
export {
  BookingEngineFactory,
  getBookingEngineFactory,
  createBookingEngineForHotel,
  hasBookingCapabilities,
} from './factory';

// Service
export { BookingService, getBookingService } from './booking-service';

// Room mapping
export {
  RoomMappingService,
  type DirectusRoom,
  type CloudbedsRoom,
  type MappedRoom,
} from './room-mapping-service';

// Import types for convenience functions
import type { RateQuery, BookingRequest } from './types';

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
  hasBookingCapabilities(hotelData: Record<string, unknown>) {
    const { hasBookingCapabilities: hasCapabilities } = require('./factory');
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
