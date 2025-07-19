/**
 * Debug endpoint to check redirect mode configuration
 */

import type { APIRoute } from 'astro';
import { getCurrentHotel } from '../../../lib/directus.js';
import { getBookingService } from '../../../lib/booking-engines';
import type { Hotel } from '../../../types/hotel.js';

export const GET: APIRoute = async () => {
  try {
    console.log('🔍 [DEBUG] Starting redirect mode debug...');

    // Get current hotel
    const hotel = (await getCurrentHotel()) as Hotel | null;
    if (!hotel) {
      return new Response(JSON.stringify({ error: 'Hotel not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('🔍 [DEBUG] Hotel found:', hotel.name);
    console.log('🔍 [DEBUG] Hotel data:', {
      id: hotel.id,
      name: hotel.name,
      pms_type: hotel.pms_type,
      cloudbeds_property_id: hotel.cloudbeds_property_id,
      cloudbeds_booking_url_id: hotel.cloudbeds_booking_url_id,
      cloudbeds_api_key: hotel.cloudbeds_api_key
        ? '***configured***'
        : 'not configured',
    });

    // Initialize booking service
    const bookingService = getBookingService();
    await bookingService.initializeForHotel(hotel);

    // Get the engine for debugging
    const engine = bookingService.getEngineForDebug(String(hotel.id));

    // Check if engine supports redirect mode
    const supportsRedirect = engine.supportsRedirectMode?.() || false;
    console.log('🔍 [DEBUG] Engine supports redirect mode:', supportsRedirect);

    // Try to generate a booking URL
    let redirectUrl = null;
    let redirectError = null;

    if (supportsRedirect && engine.generateBookingUrl) {
      try {
        redirectUrl = await engine.generateBookingUrl({
          checkIn: '2025-08-01',
          checkOut: '2025-08-03',
          adults: 2,
          children: 0,
          rooms: 1,
          guestInfo: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            country: 'US',
          },
        });
        console.log('🔍 [DEBUG] Generated redirect URL:', redirectUrl);
      } catch (error) {
        redirectError =
          error instanceof Error ? error.message : 'Unknown error';
        console.error(
          '🔍 [DEBUG] Error generating redirect URL:',
          redirectError
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        hotel: {
          id: hotel.id,
          name: hotel.name,
          pms_type: hotel.pms_type,
          cloudbeds_property_id: hotel.cloudbeds_property_id,
          cloudbeds_booking_url_id: hotel.cloudbeds_booking_url_id,
          has_api_key: !!hotel.cloudbeds_api_key,
        },
        redirectMode: {
          supportsRedirect,
          redirectUrl,
          redirectError,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('🔍 [DEBUG] Error in redirect debug:', error);
    return new Response(
      JSON.stringify({
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
