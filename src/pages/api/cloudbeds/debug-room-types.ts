/**
 * Debug endpoint to check all room types configured in Cloudbeds
 * This will help us understand why only 1 room is returned by getAvailableRoomTypes
 */

import type { APIRoute } from 'astro';
import { getBookingService } from '../../../lib/booking-engines';
import { getCurrentHotel } from '../../../lib/directus.js';
import type { Hotel } from '../../../types/hotel.js';

export const GET: APIRoute = async () => {
  try {
    console.log('🔍 [DEBUG] Starting room types debug...');

    // Get current hotel data (single-tenant mode)
    const hotel = (await getCurrentHotel()) as Hotel | null;
    if (!hotel) {
      return new Response(JSON.stringify({ error: 'Hotel not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('🔍 [DEBUG] Hotel found:', hotel.name, 'ID:', hotel.id);

    // Initialize booking service
    const bookingService = getBookingService();
    await bookingService.initializeForHotel(hotel);

    // Get the Cloudbeds engine
    const engine = bookingService.getEngineForDebug(String(hotel.id));
    if (!engine || !('debugCloudbedsRoomTypes' in engine)) {
      return new Response(
        JSON.stringify({
          error: 'Cloudbeds engine not available or debug method not found',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('🔍 [DEBUG] Calling debugCloudbedsRoomTypes...');

    // Debug Cloudbeds room types
    const roomTypesData = await (
      engine as unknown as Record<string, unknown> & {
        debugCloudbedsRoomTypes(): Promise<unknown>;
      }
    ).debugCloudbedsRoomTypes();

    console.log('🔍 [DEBUG] Room types data received:', roomTypesData);

    // Also test availability for comparison
    console.log('🔍 [DEBUG] Testing availability for comparison...');

    const availabilityQuery = {
      checkIn: '2025-07-20',
      checkOut: '2025-07-21',
      adults: 2,
      children: 0,
      rooms: 1,
    };

    const availability = await bookingService.checkAvailability(
      String(hotel.id),
      availabilityQuery
    );

    console.log('🔍 [DEBUG] Availability result:', availability);

    return new Response(
      JSON.stringify({
        success: true,
        hotel: {
          id: hotel.id,
          name: hotel.name,
          domain: hotel.domain,
        },
        roomTypes: roomTypesData,
        availabilityTest: {
          query: availabilityQuery,
          result: availability,
          count: availability.length,
        },
        analysis: {
          totalRoomTypesConfigured: (roomTypesData as Record<string, unknown>)
            ?.data
            ? Array.isArray((roomTypesData as Record<string, unknown>).data)
              ? ((roomTypesData as Record<string, unknown>).data as unknown[])
                  .length
              : 0
            : 0,
          availableRoomTypes: availability.length,
          message: 'Compare room types configured vs available for booking',
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ [DEBUG] Room types debug error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to debug room types',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
