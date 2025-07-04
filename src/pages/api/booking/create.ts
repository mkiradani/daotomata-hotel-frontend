/**
 * API endpoint for creating bookings
 */

import type { APIRoute } from 'astro';
import type { BookingRequest } from '../../../lib/booking-engines';
import { getBookingService } from '../../../lib/booking-engines';
import { getHotelByDomain } from '../../../lib/directus.js';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { hotelDomain, ...bookingData } = body;

    // Validate required fields
    if (!hotelDomain) {
      return new Response(JSON.stringify({ error: 'Missing required field: hotelDomain' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get hotel data
    const hotel = await getHotelByDomain(hotelDomain);
    if (!hotel) {
      return new Response(JSON.stringify({ error: 'Hotel not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Initialize booking service
    const bookingService = getBookingService();
    await bookingService.initializeForHotel(hotel);

    // Validate booking request
    const validation = bookingService.validateBookingRequest(bookingData as BookingRequest);
    if (!validation.valid) {
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

    // Create booking
    const bookingResponse = await bookingService.createBooking(
      hotel.id,
      bookingData as BookingRequest
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
