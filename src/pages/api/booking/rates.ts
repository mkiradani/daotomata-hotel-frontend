/**
 * API endpoint for getting room rates
 */

import type { APIRoute } from 'astro';
import { getBookingService } from '../../../lib/booking-engines';
import { getHotelByDomain } from '../../../lib/directus.js';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { hotelDomain, checkIn, checkOut, adults, children, rooms, roomTypes } = body;

    // Validate required fields
    if (!hotelDomain || !checkIn || !checkOut || !adults) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: hotelDomain, checkIn, checkOut, adults',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
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

    // Get rates
    const query = {
      checkIn,
      checkOut,
      adults: parseInt(adults),
      children: children ? parseInt(children) : undefined,
      rooms: rooms ? parseInt(rooms) : 1,
      roomTypes: roomTypes || undefined,
    };

    const rates = await bookingService.getRates(hotel.id, query);

    return new Response(
      JSON.stringify({
        success: true,
        rates,
        hotel: {
          id: hotel.id,
          name: hotel.name,
          domain: hotel.domain,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Rates check error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to get rates',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
