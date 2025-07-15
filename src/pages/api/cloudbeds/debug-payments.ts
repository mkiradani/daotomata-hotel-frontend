/**
 * Debug endpoint to test Cloudbeds payment methods
 */

import type { APIRoute } from 'astro';
import { getCurrentHotel } from '../../../lib/directus.js';
import { getBookingEngineFactory } from '../../../lib/booking-engines/factory.js';
import type { Hotel } from '../../../types/hotel.js';

export const GET: APIRoute = async () => {
  try {
    console.log('🔍 [DEBUG] Starting Cloudbeds payment methods debug...');

    // Get current hotel from Directus (single-tenant)
    const hotel = (await getCurrentHotel()) as Hotel | null;

    if (!hotel) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Hotel not found in Directus',
          timestamp: new Date().toISOString(),
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`🔍 [DEBUG] Found hotel: ${hotel.name} (ID: ${hotel.id})`);

    // Check if hotel has Cloudbeds configuration
    if (hotel.pms_type !== 'cloudbeds') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Hotel is not configured for Cloudbeds',
          hotel: {
            id: hotel.id,
            name: hotel.name,
            pms_type: hotel.pms_type,
          },
          timestamp: new Date().toISOString(),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Use the factory to create and initialize the engine with hotel data
    const factory = getBookingEngineFactory();
    const engine = await factory.createFromHotelConfig(hotel);

    console.log('🔍 [DEBUG] Engine initialized, testing payment methods...');

    // Test payment methods endpoint
    const paymentMethods = await (
      engine as Record<string, unknown> & {
        getPaymentMethods(): Promise<unknown>;
      }
    ).getPaymentMethods();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cloudbeds payment methods debug completed',
        hotel: {
          id: hotel.id,
          name: hotel.name,
          pms_type: hotel.pms_type,
        },
        payment_methods: paymentMethods,
        payment_methods_count: paymentMethods.length,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ [DEBUG] Cloudbeds payment methods debug failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
