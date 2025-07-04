/**
 * API endpoint for checking room availability
 */

import type { APIRoute } from 'astro';
import { getHotelByDomain } from '../../../lib/directus.js';
import { getBookingService } from '../../../lib/booking-engines';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { hotelDomain, checkIn, checkOut, adults, children, rooms } = body;

    // Validate required fields
    if (!hotelDomain || !checkIn || !checkOut || !adults) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: hotelDomain, checkIn, checkOut, adults' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get hotel data
    const hotel = await getHotelByDomain(hotelDomain);
    if (!hotel) {
      return new Response(
        JSON.stringify({ error: 'Hotel not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize booking service
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

    const availability = await bookingService.checkAvailability(hotel.id, query);

    return new Response(
      JSON.stringify({ 
        success: true,
        availability,
        hotel: {
          id: hotel.id,
          name: hotel.name,
          domain: hotel.domain,
        }
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Availability check error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to check availability',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
