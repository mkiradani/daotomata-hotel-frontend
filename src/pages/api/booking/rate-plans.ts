/**
 * API endpoint to get available rate plans for the current hotel
 * Used by frontend components: RoomCard, RatePlanSelector, BookingForm
 */

import type { APIRoute } from 'astro';
import { getCurrentHotel } from '../../../lib/directus.js';
import { getBookingEngineFactory } from '../../../lib/booking-engines/factory.js';
import type { IBookingEngine } from '../../../lib/booking-engines/types.ts';
import type { Hotel } from '../../../types/hotel.js';

export const GET: APIRoute = async () => {
  try {
    console.log('🔍 [API] Fetching rate plans for current hotel...');

    // Get current hotel from Directus (single-tenant)
    const hotel = (await getCurrentHotel()) as Hotel | null;

    if (!hotel) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Hotel not found',
          code: 'HOTEL_NOT_FOUND',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if hotel has PMS configuration
    if (!hotel.pms_type) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Hotel PMS not configured',
          code: 'PMS_NOT_CONFIGURED',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`🔍 [API] Hotel: ${hotel.name} (PMS: ${hotel.pms_type})`);

    // Create booking engine for the hotel
    const factory = getBookingEngineFactory();
    const engine = await factory.createFromHotelConfig(hotel);

    // Get rate plans from the booking engine
    const ratePlans = await (
      engine as IBookingEngine & { getRatePlans(): Promise<unknown> }
    ).getRatePlans();

    console.log('✅ [API] Rate plans retrieved successfully');

    return new Response(
      JSON.stringify({
        success: true,
        data: ratePlans,
        hotel: {
          id: hotel.id,
          name: hotel.name,
          pms_type: hotel.pms_type,
        },
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        },
      }
    );
  } catch (error) {
    console.error('❌ [API] Failed to fetch rate plans:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch rate plans',
        code: 'RATE_PLANS_ERROR',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
