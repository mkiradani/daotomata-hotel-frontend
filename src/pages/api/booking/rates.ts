/**
 * API endpoint for getting room rates
 */

import type { APIRoute } from 'astro';
import { getBookingService } from '../../../lib/booking-engines';
import { getCurrentHotel } from '../../../lib/directus.js';
import type { Hotel } from '../../../types/hotel.js';

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log("💰 [API] Rates request received");

    const body = await request.json();
    const {
      checkIn,
      checkOut,
      adults,
      children,
      rooms,
      roomTypes,
    } = body;

    console.log("💰 [API] Request body:", JSON.stringify(body, null, 2));

    // Validate required fields
    if (!checkIn || !checkOut || !adults) {
      console.log("❌ [API] Missing required fields");
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: checkIn, checkOut, adults',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get current hotel data (single-tenant mode)
    const hotel = await getCurrentHotel() as Hotel | null;
    if (!hotel) {
      console.log("❌ [API] Hotel not found");
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

    const rates = await bookingService.getRates(String(hotel.id), query);

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
