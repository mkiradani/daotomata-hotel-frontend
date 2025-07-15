/**
 * API endpoint for checking room availability
 */

import type { APIRoute } from 'astro';
import { getBookingService } from '../../../lib/booking-engines';
import { getCurrentHotel } from '../../../lib/directus.js';
import type { Hotel } from '../../../types/hotel.js';

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log("🚀 [API] Availability request received");

    const body = await request.json();
    const { checkIn, checkOut, adults, children, rooms } = body;

    console.log("🚀 [API] Request body:", JSON.stringify(body, null, 2));

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

    console.log("🚀 [API] Hotel found:", hotel.name, "ID:", hotel.id);

    // Initialize booking service
    console.log("🚀 [API] Initializing booking service...");
    const bookingService = getBookingService();
    await bookingService.initializeForHotel(hotel);

    // Check availability
    const query = {
      checkIn,
      checkOut,
      adults: parseInt(adults),
      children: children ? parseInt(children) : undefined,
      rooms: rooms ? parseInt(rooms) : 1,
    };

    console.log("🚀 [API] Checking availability with query:", JSON.stringify(query, null, 2));

    const availability = await bookingService.checkAvailability(
      String(hotel.id),
      query
    );

    console.log("🚀 [API] Availability result:", availability.length, "rooms found");
    console.log("🚀 [API] Availability details:", JSON.stringify(availability, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        availability,
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
    console.error('❌ [API] Availability check error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to check availability',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
