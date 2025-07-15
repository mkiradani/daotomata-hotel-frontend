/**
 * API endpoint for creating bookings
 */

import type { APIRoute } from 'astro';
import type { BookingRequest } from '../../../lib/booking-engines';
import { getBookingService } from '../../../lib/booking-engines';
import { getCurrentHotel } from '../../../lib/directus.js';
import type { Hotel } from '../../../types/hotel.js';

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('🚀 [BOOKING API] Starting booking creation process...');

    const body = await request.json();
    const bookingData = body;

    console.log(
      '🚀 [BOOKING API] Received booking data:',
      JSON.stringify(bookingData, null, 2)
    );

    // Get current hotel from Directus (single-tenant)
    const hotel = (await getCurrentHotel()) as Hotel | null;
    if (!hotel) {
      console.log('❌ [BOOKING API] Hotel not found');
      return new Response(JSON.stringify({ error: 'Hotel not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ [BOOKING API] Hotel found:', hotel.name);

    // Initialize booking service
    console.log('🔧 [BOOKING API] Initializing booking service...');
    const bookingService = getBookingService();
    await bookingService.initializeForHotel(hotel);
    console.log('✅ [BOOKING API] Booking service initialized');

    // Validate booking request
    console.log('🔍 [BOOKING API] Validating booking request...');
    const validation = bookingService.validateBookingRequest(
      bookingData as BookingRequest
    );
    if (!validation.valid) {
      console.log('❌ [BOOKING API] Validation failed:', validation.errors);
      return new Response(
        JSON.stringify({
          error: 'Invalid booking request',
          validationErrors: validation.errors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    console.log('✅ [BOOKING API] Validation passed');

    // Create booking
    console.log('📝 [BOOKING API] Creating booking...');
    const bookingResponse = await bookingService.createBooking(
      String(hotel.id),
      bookingData as BookingRequest
    );
    console.log(
      '📝 [BOOKING API] Booking response:',
      JSON.stringify(bookingResponse, null, 2)
    );

    return new Response(
      JSON.stringify({
        success: bookingResponse.success,
        booking: bookingResponse,
        hotel: {
          id: hotel.id,
          name: hotel.name,
          domain: hotel.domain,
        },
      }),
      {
        status: bookingResponse.success ? 200 : 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Booking creation error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to create booking',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
