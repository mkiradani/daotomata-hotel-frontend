/**
 * Cloudbeds booking engine implementation
 */

import type {
  IBookingEngine,
  BookingEngineConfig,
  RoomAvailability,
  BookingRequest,
  BookingResponse,
  RateQuery,
  RoomRate,
} from './types';
import { BookingEngineError, ConfigurationError, AvailabilityError, BookingError } from './types';
import { RoomMappingService, type DirectusRoom, type CloudbedsRoom } from './room-mapping-service';

export class CloudbedsEngine implements IBookingEngine {
  private config: BookingEngineConfig | null = null;
  private baseUrl = 'https://api.cloudbeds.com';
  private accessToken: string | null = null;
  private cloudbedsRooms: CloudbedsRoom[] = [];
  private directusRooms: DirectusRoom[] = [];

  async initialize(config: BookingEngineConfig): Promise<void> {
    if (!this.validateConfig(config)) {
      throw new ConfigurationError('Invalid Cloudbeds configuration');
    }

    this.config = config;

    // Initialize OAuth token if needed
    await this.ensureAccessToken();

    // Load Cloudbeds rooms for mapping
    await this.loadCloudbedsRooms();
  }

  validateConfig(config: BookingEngineConfig): boolean {
    if (config.type !== 'cloudbeds') return false;

    const { clientId, clientSecret, apiKey, propertyId } = config.credentials;

    // For Cloudbeds, we need either OAuth credentials or API key
    const hasOAuth = clientId && clientSecret;
    const hasApiKey = apiKey;

    return (hasOAuth || hasApiKey) && !!propertyId;
  }

  private async ensureAccessToken(): Promise<void> {
    if (!this.config) throw new ConfigurationError('Engine not initialized');

    const { apiKey, clientId, clientSecret } = this.config.credentials;

    if (apiKey) {
      // Use API key directly
      this.accessToken = apiKey;
      return;
    }

    if (clientId && clientSecret) {
      // TODO: Implement OAuth flow for production
      // For now, we'll assume the access token is provided
      throw new ConfigurationError('OAuth flow not implemented yet. Please use API key.');
    }

    throw new ConfigurationError('No valid authentication method found');
  }

  /**
   * Load Cloudbeds rooms for mapping
   */
  private async loadCloudbedsRooms(): Promise<void> {
    try {
      const response = await this.makeRequest('/v1/rooms');
      this.cloudbedsRooms = this.transformCloudbedsRoomsResponse(response);
    } catch (error) {
      console.warn('Failed to load Cloudbeds rooms for mapping:', error);
      // Don't throw error - mapping is optional
    }
  }

  /**
   * Set Directus rooms for mapping
   */
  setDirectusRooms(rooms: DirectusRoom[]): void {
    this.directusRooms = rooms;
  }

  /**
   * Get room mapping statistics
   */
  getRoomMappingStats(): ReturnType<typeof RoomMappingService.getMappingStats> {
    return RoomMappingService.getMappingStats(this.directusRooms, this.cloudbedsRooms);
  }

  /**
   * Get mapped rooms
   */
  getMappedRooms(): ReturnType<typeof RoomMappingService.mapRoomsByName> {
    return RoomMappingService.mapRoomsByName(this.directusRooms, this.cloudbedsRooms);
  }

  private async makeRequest(
    endpoint: string,
    options: Record<string, unknown> = {},
  ): Promise<unknown> {
    if (!this.accessToken || !this.config) {
      throw new ConfigurationError('Engine not properly initialized');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': this.accessToken,
      'x-property-id': this.config.credentials.propertyId || '',
      ...options.headers,
    };

    try {
      const response = await globalThis.fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new BookingEngineError(
          `Cloudbeds API error: ${response.status} ${response.statusText}`,
          'API_ERROR',
          errorData,
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof BookingEngineError) throw error;

      throw new BookingEngineError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NETWORK_ERROR',
        error,
      );
    }
  }

  async checkAvailability(query: RateQuery): Promise<RoomAvailability[]> {
    try {
      // Cloudbeds availability endpoint
      const params = new globalThis.URLSearchParams({
        start_date: query.checkIn,
        end_date: query.checkOut,
        adults: query.adults.toString(),
        ...(query.children && { children: query.children.toString() }),
        ...(query.rooms && { rooms: query.rooms.toString() }),
      });

      const response = await this.makeRequest(`/v1/availability?${params}`);
      const availability = this.transformAvailabilityResponse(response, query);

      // Map with Directus room information
      return RoomMappingService.mapAvailabilityWithDirectusRooms(availability, this.directusRooms);
    } catch (error) {
      throw new AvailabilityError(
        `Failed to check availability: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
    }
  }

  async getRates(query: RateQuery): Promise<RoomRate[]> {
    try {
      // Cloudbeds rates endpoint
      const params = new globalThis.URLSearchParams({
        start_date: query.checkIn,
        end_date: query.checkOut,
        adults: query.adults.toString(),
        ...(query.children && { children: query.children.toString() }),
        ...(query.rooms && { rooms: query.rooms.toString() }),
      });

      const response = await this.makeRequest(`/v1/rates?${params}`);
      const rates = this.transformRatesResponse(response, query);

      // Map with Directus room information
      return RoomMappingService.mapRatesWithDirectusRooms(rates, this.directusRooms);
    } catch (error) {
      throw new AvailabilityError(
        `Failed to get rates: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
    }
  }

  async createBooking(request: BookingRequest): Promise<BookingResponse> {
    try {
      const bookingData = this.transformBookingRequest(request);

      const response = await this.makeRequest('/v1/reservations', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });

      return this.transformBookingResponse(response);
    } catch (error) {
      throw new BookingError(
        `Failed to create booking: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
    }
  }

  async getBooking(bookingId: string): Promise<Record<string, unknown>> {
    try {
      return await this.makeRequest(`/v1/reservations/${bookingId}`);
    } catch (error) {
      throw new BookingError(
        `Failed to get booking: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
    }
  }

  async cancelBooking(bookingId: string, reason?: string): Promise<BookingResponse> {
    try {
      const response = await this.makeRequest(`/v1/reservations/${bookingId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });

      return {
        success: true,
        bookingId,
        details: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async modifyBooking(
    bookingId: string,
    changes: Partial<BookingRequest>,
  ): Promise<BookingResponse> {
    try {
      const updateData = this.transformBookingRequest(changes);

      const response = await this.makeRequest(`/v1/reservations/${bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      return this.transformBookingResponse(response);
    } catch (error) {
      throw new BookingError(
        `Failed to modify booking: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
    }
  }

  async getPropertyInfo(): Promise<Record<string, unknown>> {
    try {
      return await this.makeRequest('/v1/properties');
    } catch (error) {
      throw new BookingEngineError(
        `Failed to get property info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PROPERTY_ERROR',
        error,
      );
    }
  }

  getSupportedFeatures(): string[] {
    return [
      'availability',
      'rates',
      'booking',
      'cancellation',
      'modification',
      'property_info',
      'multi_room',
      'guest_info',
      'special_requests',
    ];
  }

  // Transform methods to convert between our common format and Cloudbeds format
  private transformCloudbedsRoomsResponse(response: Record<string, unknown>): CloudbedsRoom[] {
    // Transform Cloudbeds rooms response to our CloudbedsRoom format
    const rooms = response.rooms as Array<Record<string, unknown>> | undefined;
    return (
      rooms?.map((room) => ({
        id: String(room.id || ''),
        name: String(room.name || ''),
        type: String(room.type || ''),
        max_occupancy: Number(room.max_occupancy || 0),
        available: Boolean(room.available),
        price: Number(room.price || 0),
        currency: String(room.currency || 'USD'),
        ...room, // Include all other properties
      })) || []
    );
  }

  private transformAvailabilityResponse(
    response: Record<string, unknown>,
    query: RateQuery,
  ): RoomAvailability[] {
    // Transform Cloudbeds availability response to our common format
    // This is a simplified implementation - adjust based on actual Cloudbeds API response
    const rooms = response.rooms as Array<Record<string, unknown>> | undefined;
    return (
      rooms?.map((room) => ({
        roomId: String(room.id || ''),
        roomType: String(room.type || ''),
        available: Boolean(room.available),
        price: Number(room.price || 0),
        currency: String(room.currency || this.config?.settings?.currency || 'USD'),
        maxOccupancy: Number(room.max_occupancy || 0),
        checkIn: query.checkIn,
        checkOut: query.checkOut,
        restrictions: room.restrictions as Record<string, unknown> | undefined,
      })) || []
    );
  }

  private transformRatesResponse(response: Record<string, unknown>): RoomRate[] {
    // Transform Cloudbeds rates response to our common format
    const rates = response.rates as Array<Record<string, unknown>> | undefined;
    return (
      rates?.map((rate) => ({
        roomId: rate.room_id,
        roomType: rate.room_type,
        ratePlanId: rate.rate_plan_id,
        ratePlanName: rate.rate_plan_name,
        basePrice: rate.base_price,
        totalPrice: rate.total_price,
        currency: rate.currency || this.config?.settings?.currency || 'USD',
        taxes: rate.taxes,
        fees: rate.fees,
        discounts: rate.discounts,
        breakdown: rate.breakdown,
      })) || []
    );
  }

  private transformBookingRequest(request: Partial<BookingRequest>): Record<string, unknown> {
    // Transform our common booking request to Cloudbeds format
    return {
      start_date: request.checkIn,
      end_date: request.checkOut,
      adults: request.adults,
      children: request.children,
      rooms: request.rooms,
      room_type: request.roomType,
      guest: request.guestInfo && {
        first_name: request.guestInfo.firstName,
        last_name: request.guestInfo.lastName,
        email: request.guestInfo.email,
        phone: request.guestInfo.phone,
        address: request.guestInfo.address,
      },
      special_requests: request.specialRequests,
      promo_code: request.promoCode,
    };
  }

  private transformBookingResponse(response: Record<string, unknown>): BookingResponse {
    // Transform Cloudbeds booking response to our common format
    return {
      success: !!response.id,
      bookingId: response.id,
      confirmationNumber: response.confirmation_number,
      totalAmount: response.total_amount,
      currency: response.currency,
      details: response,
    };
  }
}
