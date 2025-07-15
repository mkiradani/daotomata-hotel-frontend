/**
 * Debug endpoint to test corrected Cloudbeds API configuration
 */

import type { APIRoute } from 'astro';
import { getCurrentHotel } from '../../../lib/directus.js';
import { getBookingEngineFactory } from '../../../lib/booking-engines/factory.js';
import type { Hotel } from '../../../types/hotel.js';

export const GET: APIRoute = async () => {
  try {
    console.log(
      '🔍 [DEBUG] Starting Cloudbeds debug with Directus credentials...'
    );

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
    console.log(`🔍 [DEBUG] PMS Type: ${hotel.pms_type}`);
    console.log(`🔍 [DEBUG] Cloudbeds credentials check:`, {
      hasClientId: !!hotel.cloudbeds_client_id,
      hasClientSecret: !!hotel.cloudbeds_client_secret,
      hasApiKey: !!hotel.cloudbeds_api_key,
      hasPropertyId: !!hotel.cloudbeds_property_id,
      propertyId: hotel.cloudbeds_property_id,
    });

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

    console.log(
      '🔍 [DEBUG] Engine initialized with Directus credentials and API v1.3'
    );

    // Test hotels endpoint first
    console.log('🔍 [DEBUG] Testing getHotels endpoint...');
    const hotelsResponse = await (
      engine as Record<string, unknown> & {
        debugCloudbedsHotels(): Promise<unknown>;
      }
    ).debugCloudbedsHotels();

    // Test rooms endpoint
    console.log('🔍 [DEBUG] Testing getRooms endpoint...');
    const roomsResponse = await (
      engine as Record<string, unknown> & {
        debugCloudbedsRooms(): Promise<unknown>;
      }
    ).debugCloudbedsRooms();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cloudbeds debug completed with Directus credentials',
        hotel: {
          id: hotel.id,
          name: hotel.name,
          pms_type: hotel.pms_type,
        },
        corrections: {
          credentialsSource: 'Directus (not environment variables)',
          baseUrl: 'https://api.cloudbeds.com/api/v1.3',
          authMethod: 'OAuth Bearer (not x-api-key)',
          endpoints: 'getRooms, getHotels (not /v1/rooms)',
        },
        cloudbeds_config: {
          hasApiKey: !!hotel.cloudbeds_api_key,
          hasClientId: !!hotel.cloudbeds_client_id,
          hasClientSecret: !!hotel.cloudbeds_client_secret,
          propertyId: hotel.cloudbeds_property_id,
        },
        results: {
          hotels: hotelsResponse,
          rooms: roomsResponse,
        },
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ [DEBUG] Cloudbeds debug failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
        corrections: {
          credentialsSource: 'Directus (not environment variables)',
          baseUrl: 'https://api.cloudbeds.com/api/v1.3',
          authMethod: 'OAuth Bearer (not x-api-key)',
          endpoints: 'getRooms, getHotels (not /v1/rooms)',
        },
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
