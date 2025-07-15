/**
 * Cloudbeds booking engine implementation
 */

import {
  type CloudbedsRoom,
  type DirectusRoom,
  RoomMappingService,
} from './room-mapping-service';
import type {
  BookingEngineConfig,
  BookingRequest,
  BookingResponse,
  IBookingEngine,
  RateQuery,
  RoomAvailability,
  RoomRate,
} from './types';
import {
  AvailabilityError,
  BookingEngineError,
  BookingError,
  ConfigurationError,
} from './types';
import type {
  CloudbedsApiResponse,
  CloudbedsAvailabilityResponse,
  CloudbedsBookingRequest,
  CloudbedsBookingResponse,
  CloudbedsListResponse,
  CloudbedsPaymentMethodResponse,
  CloudbedsPaymentRequest,
  CloudbedsPaymentResponse,
  CloudbedsPropertyResponse,
  CloudbedsRatePlansResponse,
  CloudbedsRatesResponse,
  CloudbedsRequestOptions,
  CloudbedsRoomsListResponse,
} from '../../types/cloudbeds-api';

/**
 * Centralized mapping of Cloudbeds API endpoints
 * Based on official Cloudbeds API v1.2 documentation (working version)
 * Eliminates hardcoding and ensures DRY principle compliance
 */
const CLOUDBEDS_ENDPOINTS = {
  // Hotel and property information
  getHotels: '/getHotels',

  // Room management
  getRooms: '/getRooms',
  getRoomTypes: '/getRoomTypes',

  // Availability and rates
  getAvailableRoomTypes: '/getAvailableRoomTypes', // CORRECTED: was /v1/availability
  getRate: '/getRate', // CORRECTED: was /v1/rates
  getRatePlans: '/getRatePlans',

  // Reservations
  postReservation: '/postReservation',
  putReservation: '/putReservation',
  getReservation: '/getReservation',
  deleteReservation: '/deleteReservation',

  // Payments
  getPaymentMethods: '/getPaymentMethods',
  postPayment: '/postPayment',
} as const;

export class CloudbedsEngine implements IBookingEngine {
  private config: BookingEngineConfig | null = null;
  private baseUrl = 'https://api.cloudbeds.com/api/v1.3';
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

    return Boolean((hasOAuth || hasApiKey) && propertyId);
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
      throw new ConfigurationError(
        'OAuth flow not implemented yet. Please use API key.'
      );
    }

    throw new ConfigurationError('No valid authentication method found');
  }

  /**
   * Load Cloudbeds rooms for mapping
   */
  private async loadCloudbedsRooms(): Promise<void> {
    try {
      const response =
        await this.makeRequest<CloudbedsRoomsListResponse>('/getRooms');
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
    return RoomMappingService.getMappingStats(
      this.directusRooms,
      this.cloudbedsRooms
    );
  }

  /**
   * Get mapped rooms
   */
  getMappedRooms(): ReturnType<typeof RoomMappingService.mapRoomsByName> {
    return RoomMappingService.mapRoomsByName(
      this.directusRooms,
      this.cloudbedsRooms
    );
  }

  private async makeRequest<T = CloudbedsApiResponse>(
    endpoint: string,
    options: CloudbedsRequestOptions = {}
  ): Promise<T> {
    if (!this.accessToken || !this.config) {
      throw new ConfigurationError('Engine not properly initialized');
    }

    const url = `${this.baseUrl}${endpoint}`;

    // CORRECCIÓN: Usar Authorization Bearer en lugar de x-api-key
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.accessToken}`,
      'x-property-id': this.config.credentials.propertyId || '',
      ...options.headers,
    };

    console.log('🌐 [CLOUDBEDS] API Request:');
    console.log('🌐 [CLOUDBEDS] URL:', url);
    console.log('🌐 [CLOUDBEDS] Method:', options.method || 'GET');
    console.log('🌐 [CLOUDBEDS] Headers:', {
      ...headers,
      Authorization: `Bearer ${this.accessToken.substring(0, 10)}...`,
    });
    if (options.body) {
      console.log('🌐 [CLOUDBEDS] Body:', options.body);
    }

    try {
      const response = await globalThis.fetch(url, {
        ...options,
        headers,
      });

      console.log(
        '🌐 [CLOUDBEDS] Response status:',
        response.status,
        response.statusText
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [CLOUDBEDS] API Error:', errorData);
        throw new BookingEngineError(
          `Cloudbeds API error: ${response.status} ${response.statusText}`,
          'API_ERROR',
          errorData
        );
      }

      const responseData = await response.json();
      console.log(
        '🌐 [CLOUDBEDS] Response data:',
        JSON.stringify(responseData, null, 2)
      );

      return responseData;
    } catch (error) {
      if (error instanceof BookingEngineError) throw error;

      console.error('❌ [CLOUDBEDS] Network Error:', error);
      throw new BookingEngineError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NETWORK_ERROR',
        error
      );
    }
  }

  async checkAvailability(query: RateQuery): Promise<RoomAvailability[]> {
    try {
      console.log('🏨 [CLOUDBEDS] Starting availability check...');
      console.log(
        '🏨 [CLOUDBEDS] Query parameters:',
        JSON.stringify(query, null, 2)
      );
      console.log(
        '🏨 [CLOUDBEDS] Property ID:',
        this.config?.credentials.propertyId
      );

      // Step 1: Use getAvailableRoomTypes as the primary source for availability.
      // This aligns with the recommended Cloudbeds flow for initial searches.
      const params = new globalThis.URLSearchParams({
        propertyIDs: this.config?.credentials.propertyId || '',
        startDate: query.checkIn,
        endDate: query.checkOut,
        adults: query.adults.toString(),
        ...(query.children && { children: query.children.toString() }),
        ...(query.rooms && { rooms: query.rooms.toString() }),
        // 'detailedRates' can be added if night-by-night breakdown is needed later.
      });

      console.log('🏨 [CLOUDBEDS] API parameters:', params.toString());

      const response = await this.makeRequest<CloudbedsAvailabilityResponse>(
        `${CLOUDBEDS_ENDPOINTS.getAvailableRoomTypes}?${params}`
      );

      console.log(
        '🏨 [CLOUDBEDS] Raw API response:',
        JSON.stringify(response, null, 2)
      );

      if (!response.success || !response.data) {
        console.log('🏨 [CLOUDBEDS] No data or unsuccessful response');
        return [];
      }

      const availability = this.transformAvailabilityResponse(response, query);
      console.log(
        '🏨 [CLOUDBEDS] Transformed availability:',
        availability.length,
        'rooms'
      );

      // Map with Directus room information to add local details
      return RoomMappingService.mapAvailabilityWithDirectusRooms(
        availability,
        this.directusRooms
      );
    } catch (error) {
      // Catch and re-throw with a more specific error type for better handling upstream.
      throw new AvailabilityError(
        `Failed to check availability: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  async getRates(query: RateQuery): Promise<RoomRate[]> {
    try {
      console.log('💰 [CLOUDBEDS] Starting rates check...');
      console.log(
        '💰 [CLOUDBEDS] Query parameters:',
        JSON.stringify(query, null, 2)
      );

      // CORRECTED: Use official Cloudbeds API endpoint with required propertyID parameter
      const params = new globalThis.URLSearchParams({
        propertyID: this.config?.credentials.propertyId || '',
        startDate: query.checkIn,
        endDate: query.checkOut,
        adults: query.adults.toString(),
        ...(query.children && { children: query.children.toString() }),
        ...(query.rooms && { rooms: query.rooms.toString() }),
      });

      console.log('💰 [CLOUDBEDS] API parameters:', params.toString());

      const response = await this.makeRequest<CloudbedsRatesResponse>(
        `${CLOUDBEDS_ENDPOINTS.getRate}?${params}`
      );

      console.log(
        '💰 [CLOUDBEDS] Raw rates response:',
        JSON.stringify(response, null, 2)
      );

      const rates = this.transformRatesResponse(response);
      console.log('💰 [CLOUDBEDS] Transformed rates:', rates.length, 'rates');

      // Map with Directus room information
      return RoomMappingService.mapRatesWithDirectusRooms(
        rates,
        this.directusRooms
      );
    } catch (error) {
      throw new AvailabilityError(
        `Failed to get rates: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  async createBooking(request: BookingRequest): Promise<BookingResponse> {
    try {
      console.log('📝 [CLOUDBEDS] Starting booking creation...');
      console.log(
        '📝 [CLOUDBEDS] Booking request:',
        JSON.stringify(request, null, 2)
      );

      const bookingData = this.transformBookingRequest(request);
      console.log(
        '📝 [CLOUDBEDS] Transformed booking data:',
        JSON.stringify(bookingData, null, 2)
      );

      // Convert to form data as required by Cloudbeds API
      const formData = new URLSearchParams();

      // Add all fields as form data
      formData.append('propertyID', bookingData.propertyID);
      formData.append('startDate', bookingData.startDate);
      formData.append('endDate', bookingData.endDate);
      formData.append('guestFirstName', bookingData.guestFirstName);
      formData.append('guestLastName', bookingData.guestLastName);
      formData.append('guestEmail', bookingData.guestEmail);
      formData.append('guestCountry', bookingData.guestCountry);
      formData.append('guestZip', '00000'); // Default ZIP code - should be configurable
      formData.append('paymentMethod', bookingData.paymentMethod);

      if (bookingData.guestPhone) {
        formData.append('guestPhone', bookingData.guestPhone);
      }

      if (bookingData.specialRequests) {
        formData.append('specialRequests', bookingData.specialRequests);
      }

      if (bookingData.promoCode) {
        formData.append('promoCode', bookingData.promoCode);
      }

      // Handle arrays according to Cloudbeds API documentation
      // Each array should contain objects with roomTypeID and quantity

      // For rooms array - according to docs: { roomTypeID, quantity }
      bookingData.rooms.forEach((room, index) => {
        if (room.roomTypeID) {
          formData.append(`rooms[${index}][roomTypeID]`, room.roomTypeID);
          formData.append(`rooms[${index}][quantity]`, '1'); // 1 room of this type
        }
      });

      // For adults array - according to docs: { roomTypeID, quantity }
      const totalAdults = bookingData.adults?.length || 2;
      bookingData.rooms.forEach((room, index) => {
        if (room.roomTypeID) {
          formData.append(`adults[${index}][roomTypeID]`, room.roomTypeID);
          formData.append(`adults[${index}][quantity]`, totalAdults.toString());
        }
      });

      // For children array - according to docs: { roomTypeID, quantity }
      const totalChildren = bookingData.children?.length || 0;
      bookingData.rooms.forEach((room, index) => {
        if (room.roomTypeID) {
          formData.append(`children[${index}][roomTypeID]`, room.roomTypeID);
          formData.append(
            `children[${index}][quantity]`,
            totalChildren.toString()
          );
        }
      });

      formData.append(
        'sendEmailConfirmation',
        bookingData.sendEmailConfirmation ? 'true' : 'false'
      );

      console.log('🌐 [CLOUDBEDS] Form data:', formData.toString());

      const response = await this.makeRequest<CloudbedsBookingResponse>(
        CLOUDBEDS_ENDPOINTS.postReservation,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        }
      );

      console.log(
        '📝 [CLOUDBEDS] Raw booking response:',
        JSON.stringify(response, null, 2)
      );

      const transformedResponse = this.transformBookingResponse(response);
      console.log(
        '📝 [CLOUDBEDS] Transformed booking response:',
        JSON.stringify(transformedResponse, null, 2)
      );

      return transformedResponse;
    } catch (error) {
      console.error('❌ [CLOUDBEDS] Booking creation failed:', error);
      throw new BookingError(
        `Failed to create booking: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  async getBooking(bookingId: string): Promise<Record<string, unknown>> {
    try {
      console.log('🔍 [CLOUDBEDS] Getting booking details...');
      console.log('🔍 [CLOUDBEDS] Booking ID:', bookingId);

      const response = await this.makeRequest<CloudbedsBookingResponse>(
        `${CLOUDBEDS_ENDPOINTS.getReservation}?reservationID=${bookingId}`
      );

      console.log(
        '🔍 [CLOUDBEDS] Booking details response:',
        JSON.stringify(response, null, 2)
      );

      return response;
    } catch (error) {
      console.error('❌ [CLOUDBEDS] Failed to get booking:', error);
      throw new BookingError(
        `Failed to get booking: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  async cancelBooking(
    bookingId: string,
    reason?: string
  ): Promise<BookingResponse> {
    try {
      const response = await this.makeRequest(
        CLOUDBEDS_ENDPOINTS.deleteReservation,
        {
          method: 'POST',
          body: JSON.stringify({ reservationID: bookingId, reason }),
        }
      );

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
    changes: Partial<BookingRequest>
  ): Promise<BookingResponse> {
    try {
      const updateData = this.transformBookingRequest(changes);

      const response = await this.makeRequest<CloudbedsBookingResponse>(
        CLOUDBEDS_ENDPOINTS.putReservation,
        {
          method: 'POST',
          body: JSON.stringify({ reservationID: bookingId, ...updateData }),
        }
      );

      return this.transformBookingResponse(response);
    } catch (error) {
      throw new BookingError(
        `Failed to modify booking: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  async getPropertyInfo(): Promise<Record<string, unknown>> {
    try {
      return await this.makeRequest<CloudbedsPropertyResponse>(
        CLOUDBEDS_ENDPOINTS.getHotels
      );
    } catch (error) {
      throw new BookingEngineError(
        `Failed to get property info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PROPERTY_ERROR',
        error
      );
    }
  }

  /**
   * Debug method to inspect actual Cloudbeds room data structure
   */
  async debugCloudbedsRooms(): Promise<unknown> {
    return await this.makeRequest('/getRooms');
  }

  /**
   * Debug method to inspect actual Cloudbeds room types data structure
   */
  async debugCloudbedsRoomTypes(): Promise<unknown> {
    return await this.makeRequest('/getRoomTypes');
  }

  /**
   * Get available payment methods for the property
   */
  async getPaymentMethods(): Promise<CloudbedsPaymentMethodResponse> {
    try {
      const response =
        await this.makeRequest<CloudbedsPaymentMethodResponse>(
          '/getPaymentMethods'
        );
      return response;
    } catch {
      // CORRECTED: Fallback data now matches the updated CloudbedsPaymentMethodResponse type.
      return {
        success: true,
        data: {
          propertyID: this.config?.credentials.propertyId || '',
          methods: [
            {
              type: 'credit',
              name: 'Credit Card',
              cardTypes: [
                { cardCode: 'visa', cardName: 'Visa' },
                { cardCode: 'master', cardName: 'Mastercard' },
              ],
            },
            {
              type: 'bank_transfer',
              name: 'Bank Transfer',
            },
          ],
        },
      };
    }
  }

  /**
   * Process payment for a reservation
   * CORRECTED: Uses form-urlencoded format with correct parameters
   */
  async processPayment(
    paymentRequest: CloudbedsPaymentRequest
  ): Promise<CloudbedsPaymentResponse> {
    try {
      console.log('💳 [CLOUDBEDS] Starting payment processing...');
      console.log(
        '💳 [CLOUDBEDS] Payment request:',
        JSON.stringify(paymentRequest, null, 2)
      );

      // CORRECCIÓN: Usar form-urlencoded en lugar de JSON
      const formData = new URLSearchParams();
      formData.append(
        'reservationID',
        paymentRequest.reservation_id.toString()
      );
      formData.append('amount', paymentRequest.amount.toString());
      formData.append('type', 'credit'); // Tipo correcto obtenido de getPaymentMethods
      formData.append('paymentMethodID', paymentRequest.payment_method_id);

      if (paymentRequest.currency) {
        formData.append('currency', paymentRequest.currency);
      }
      if (paymentRequest.description) {
        formData.append('description', paymentRequest.description);
      }
      if (paymentRequest.guest_id) {
        formData.append('guestID', paymentRequest.guest_id.toString());
      }

      console.log(
        '💳 [CLOUDBEDS] Form data:',
        Object.fromEntries(formData.entries())
      );

      // Hacer request directo con fetch para usar form-urlencoded
      const url = `${this.baseUrl}/postPayment`;
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${this.accessToken}`,
        'x-property-id': this.config?.credentials.propertyId || '',
      };

      console.log('💳 [CLOUDBEDS] Payment request URL:', url);
      console.log('💳 [CLOUDBEDS] Payment headers:', {
        ...headers,
        Authorization: 'Bearer ***',
      });

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData.toString(),
      });

      const responseText = await response.text();
      console.log('💳 [CLOUDBEDS] Raw payment response:', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error(
          '❌ [CLOUDBEDS] Failed to parse payment response:',
          parseError
        );
        throw new BookingError(
          `Invalid JSON response: ${responseText}`,
          parseError
        );
      }

      console.log(
        '💳 [CLOUDBEDS] Parsed payment response:',
        JSON.stringify(responseData, null, 2)
      );

      if (!response.ok || !responseData.success) {
        console.error('❌ [CLOUDBEDS] Payment failed:', responseData);
        throw new BookingError(
          `Payment failed: ${responseData.message || response.statusText}`,
          responseData
        );
      }

      // Convertir respuesta al formato esperado
      const paymentResponse: CloudbedsPaymentResponse = {
        success: responseData.success,
        message: responseData.message || 'Payment processed successfully',
        id:
          responseData.data?.paymentID ||
          responseData.data?.id ||
          Date.now().toString(),
        reservation_id: paymentRequest.reservation_id,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency || 'USD',
        status: responseData.success ? 'completed' : 'failed',
        payment_method: paymentRequest.payment_method_id,
        transaction_id:
          responseData.data?.transactionID || responseData.data?.transaction_id,
        processed_at: new Date().toISOString(),
      };

      return paymentResponse;
    } catch (error) {
      console.error('❌ [ERROR] Payment processing failed:', error);

      // For payment processing, we should not use fallbacks in production
      throw new BookingError(
        `Payment processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  /**
   * Get available rate plans for the property
   * Rate plans include different pricing options like breakfast included, free cancellation, etc.
   */
  async getRatePlans(
    startDate?: string,
    endDate?: string
  ): Promise<CloudbedsRatePlansResponse> {
    try {
      // Set default dates if not provided (next 30 days)
      const defaultStartDate =
        startDate || new Date().toISOString().split('T')[0];
      const defaultEndDate =
        endDate ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];

      const params = new URLSearchParams({
        startDate: defaultStartDate,
        endDate: defaultEndDate,
      });

      const response = await this.makeRequest<CloudbedsRatePlansResponse>(
        `/getRatePlans?${params}`
      );

      if (!response.success || !response.data) {
        throw new Error('No rate plans data found in Cloudbeds response');
      }

      return response;
    } catch {
      console.warn(
        '⚠️ [FALLBACK] Cloudbeds rate plans API unavailable, using default rate plans'
      );
      // CORRECTED: Fallback data now matches the updated CloudbedsRatePlansResponse type.
      return {
        success: true,
        data: [
          {
            id: 'standard',
            name: 'Standard Rate',
            description: 'Our standard room rate with flexible cancellation',
            rate_type: 'standard',
            currency: 'USD',
            is_active: true,
            inclusions: ['WiFi', 'Daily housekeeping'],
          },
          {
            id: 'breakfast',
            name: 'Breakfast Included',
            description:
              'Room rate with complimentary breakfast for all guests',
            rate_type: 'package',
            currency: 'USD',
            is_active: true,
            inclusions: ['WiFi', 'Daily housekeeping', 'Continental breakfast'],
          },
          {
            id: 'non_refundable',
            name: 'Non-Refundable Rate',
            description: 'Best available rate with no cancellation allowed',
            rate_type: 'promotional',
            currency: 'USD',
            is_active: true,
            restrictions: { non_refundable: true },
            inclusions: ['WiFi', 'Daily housekeeping'],
          },
        ],
      };
    }
  }

  /**
   * Get detailed hotel information from Cloudbeds
   * Complements Directus data with PMS-specific information like policies, amenities, etc.
   */
  async getHotelDetails(): Promise<
    CloudbedsListResponse<CloudbedsPropertyResponse>
  > {
    try {
      const response =
        await this.makeRequest<
          CloudbedsListResponse<CloudbedsPropertyResponse>
        >('/getHotels');

      if (
        response.success &&
        response.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        return response;
      }

      throw new Error('No hotel details data found in Cloudbeds response');
    } catch {
      console.warn(
        '⚠️ [FALLBACK] Cloudbeds hotel details API unavailable, using default details'
      );

      // Fallback to default hotel details when API is unavailable
      return {
        success: true,
        data: [
          {
            id: this.config?.credentials.propertyId || 'default',
            name: 'Hotel Property',
          } as CloudbedsPropertyResponse,
        ],
      };
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
      'payment_methods',
      'payment_processing',
      'rate_plans',
      'hotel_details',
      'debug_rooms', // Added for debugging
    ];
  }

  // Transform methods to convert between our common format and Cloudbeds format
  private transformCloudbedsRoomsResponse(
    response: CloudbedsRoomsListResponse
  ): CloudbedsRoom[] {
    // Transform Cloudbeds rooms response to our CloudbedsRoom format
    // The response structure is: { data: [{ propertyID, rooms: [...] }] }
    const allRooms: CloudbedsRoom[] = [];

    if (response.data && Array.isArray(response.data)) {
      response.data.forEach((property: unknown) => {
        const propertyData = property as { rooms?: unknown[] };
        if (propertyData.rooms && Array.isArray(propertyData.rooms)) {
          propertyData.rooms.forEach((room: unknown) => {
            const roomData = room as {
              roomID?: string;
              roomName?: string;
              roomTypeName?: string;
              maxGuests?: number;
              roomBlocked?: boolean;
              roomTypeID?: string;
              roomTypeNameShort?: string;
            };
            allRooms.push({
              id: String(roomData.roomID || ''),
              name: String(roomData.roomName || ''),
              type: String(roomData.roomTypeName || ''),
              max_occupancy: Number(roomData.maxGuests || 0),
              available: !roomData.roomBlocked,
              price: Number(0), // Will be set from rates
              currency: String('USD'), // Default currency
              // Add Cloudbeds-specific fields for mapping
              roomTypeID: String(roomData.roomTypeID || ''),
              roomTypeName: String(roomData.roomTypeName || ''),
              roomTypeNameShort: String(roomData.roomTypeNameShort || ''),
            });
          });
        }
      });
    }

    console.log('🔄 [CLOUDBEDS] Transformed rooms:', allRooms.length, 'rooms');
    console.log(
      '🔄 [CLOUDBEDS] Room types found:',
      allRooms.map((r) => ({
        id: r.roomTypeID,
        name: r.roomTypeName,
        short: r.roomTypeNameShort,
      }))
    );

    return allRooms;
  }

  private transformAvailabilityResponse(
    response: CloudbedsAvailabilityResponse,
    query: RateQuery
  ): RoomAvailability[] {
    console.log('🔄 [CLOUDBEDS] Transforming availability response...');
    console.log('🔄 [CLOUDBEDS] Response success:', response.success);
    console.log(
      '🔄 [CLOUDBEDS] Response data length:',
      response.data?.length || 0
    );

    // Transform Cloudbeds availability response to our common format
    // This now correctly processes the structure from getAvailableRoomTypes.
    if (!response.success || !response.data) {
      console.log('🔄 [CLOUDBEDS] No success or data in response');
      return [];
    }

    const allRooms: RoomAvailability[] = [];

    // The response contains an array of properties, each with its rooms.
    for (const property of response.data) {
      console.log('🔄 [CLOUDBEDS] Processing property:', property.propertyID);

      if (!property.propertyRooms || !Array.isArray(property.propertyRooms)) {
        console.log('🔄 [CLOUDBEDS] No propertyRooms in property');
        continue;
      }

      console.log(
        '🔄 [CLOUDBEDS] Property has',
        property.propertyRooms.length,
        'rooms'
      );

      for (const room of property.propertyRooms) {
        const roomsAvailable = room.roomsAvailable || 0;
        console.log(
          `🔄 [CLOUDBEDS] Room ${room.roomTypeName} (${room.roomTypeID}): ${roomsAvailable} available`
        );

        if (roomsAvailable > 0) {
          allRooms.push({
            roomId: String(room.roomTypeID),
            roomType: String(room.roomTypeName),
            available: true,
            // Use roomRate as the base price. totalRate might include extra charges we don't need yet.
            price: Number(room.roomRate),
            currency: property.propertyCurrency?.currencyCode || 'USD',
            maxOccupancy: Number(room.maxGuests),
            checkIn: query.checkIn,
            checkOut: query.checkOut,
            // CORRECTED: The 'restrictions' object no longer contains 'availableRooms',
            // which is not part of the 'RoomAvailability' type in './types'.
            // The number of available rooms is a top-level property on the room object itself if needed elsewhere.
            restrictions: {
              minStay: 1, // Placeholder, getRatePlans would provide actual minLos/maxLos
              maxStay: 30, // Placeholder
            },
          });
          console.log(
            `✅ [CLOUDBEDS] Added room: ${room.roomTypeName} ($${room.roomRate})`
          );
        } else {
          console.log(
            `❌ [CLOUDBEDS] Skipped room: ${room.roomTypeName} (${roomsAvailable} available)`
          );
        }
      }
    }

    console.log(`🔄 [CLOUDBEDS] Final availability: ${allRooms.length} rooms`);
    return allRooms;
  }

  private transformRatesResponse(response: CloudbedsRatesResponse): RoomRate[] {
    // Transform Cloudbeds rates response to our common format
    return (
      response.rates?.map((rate: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rateData = rate as any;
        return {
          roomId: String(rateData.room_id),
          roomType: String(rateData.room_type),
          ratePlanId: String(rateData.rate_plan_id),
          ratePlanName: String(rateData.rate_plan_name),
          basePrice: Number(rateData.base_rate),
          totalPrice: Number(rateData.total_rate),
          currency: String(
            rateData.currency || this.config?.settings?.currency || 'USD'
          ),
          taxes: Number(rateData.taxes || 0),
          fees: Number(rateData.fees || 0),
          discounts: Number(rateData.discounts || 0),
          breakdown: undefined, // Not available in Cloudbeds API response
        };
      }) || []
    );
  }

  private transformBookingRequest(
    request: Partial<BookingRequest>
  ): CloudbedsBookingRequest {
    // Transform our common booking request to Cloudbeds API v1.3 format
    // According to official documentation: https://docs.cloudbeds.com/api/v1.3/postReservation

    console.log(
      '🔍 [CLOUDBEDS] Raw booking request received:',
      JSON.stringify(request, null, 2)
    );

    const roomsCount = request.rooms || 1;
    const adultsCount = request.adults || 1;
    const childrenCount = request.children || 0;

    // Find the correct roomTypeID from Cloudbeds data
    let roomTypeID = request.roomType;
    if (this.cloudbedsRooms && this.cloudbedsRooms.length > 0) {
      const matchingRoom = this.cloudbedsRooms.find(
        (room) =>
          room.roomTypeName === request.roomType ||
          room.roomTypeNameShort === request.roomType ||
          room.roomTypeID === request.roomType
      );
      if (matchingRoom) {
        roomTypeID = matchingRoom.roomTypeID;
        console.log(
          '🔍 [CLOUDBEDS] Mapped room type:',
          request.roomType,
          '->',
          roomTypeID
        );
      } else {
        console.warn(
          '⚠️ [CLOUDBEDS] Could not find roomTypeID for:',
          request.roomType
        );
        console.log(
          '🔍 [CLOUDBEDS] Available room types:',
          this.cloudbedsRooms.map((r) => ({
            id: r.roomTypeID,
            name: r.roomTypeName,
            short: r.roomTypeNameShort,
          }))
        );
      }
    }

    // Create arrays as required by Cloudbeds API
    const roomsArray = Array(roomsCount).fill({ roomTypeID });
    const adultsArray = Array(adultsCount).fill({});
    const childrenArray =
      childrenCount > 0 ? Array(childrenCount).fill({}) : [];

    const transformedData = {
      propertyID: this.config.credentials.propertyId || '',
      startDate: request.checkIn || '',
      endDate: request.checkOut || '',
      guestFirstName: request.guestInfo?.firstName || '',
      guestLastName: request.guestInfo?.lastName || '',
      guestEmail: request.guestInfo?.email || '',
      guestPhone: request.guestInfo?.phone || '',
      guestCountry:
        request.guestInfo?.country ||
        request.guestInfo?.address?.country ||
        'US', // Default to US if not provided
      rooms: roomsArray,
      adults: adultsArray,
      children: childrenArray,
      paymentMethod: request.paymentMethod || 'cash', // Default to cash if not provided
      specialRequests: request.specialRequests || '',
      promoCode: request.promoCode || '',
      sendEmailConfirmation: true,
    };

    console.log(
      '🔍 [CLOUDBEDS] Transformed booking data:',
      JSON.stringify(transformedData, null, 2)
    );
    console.log('🔍 [CLOUDBEDS] Key fields check:');
    console.log('  - propertyID:', transformedData.propertyID);
    console.log('  - startDate:', transformedData.startDate);
    console.log('  - endDate:', transformedData.endDate);
    console.log('  - checkIn from request:', request.checkIn);
    console.log('  - checkOut from request:', request.checkOut);

    return transformedData;
  }

  private transformBookingResponse(
    response: CloudbedsBookingResponse
  ): BookingResponse {
    // Transform Cloudbeds booking response to our common format
    // Cloudbeds returns reservationID, grandTotal, etc.
    return {
      success: Boolean(response.success),
      bookingId: String(response.reservationID || 'undefined'),
      confirmationNumber: String(response.reservationID || 'undefined'), // Use reservationID as confirmation
      totalAmount: Number(response.grandTotal) || undefined,
      currency: String('USD'), // Default currency - could be made configurable
      details: response,
    };
  }
}
