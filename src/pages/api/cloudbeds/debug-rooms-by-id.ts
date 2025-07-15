/**
 * Debug endpoint to inspect Cloudbeds room data by hotel ID
 */

import type { APIRoute } from 'astro';
import { getBookingService } from '../../../lib/booking-engines';
import { getHotelById } from '../../../lib/directus.js';
import type { Hotel } from '../../../types/hotel.js';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const hotelId = searchParams.get('hotelId') || '2'; // Default to Baberrih (ID 2)

    console.log(`🔍 [DEBUG] Fetching hotel with ID: ${hotelId}`);

    // Get hotel data by ID
    const hotel = (await getHotelById(hotelId)) as Hotel | null;
    if (!hotel) {
      return new Response(
        JSON.stringify({
          error: 'Hotel not found',
          hotelId: hotelId,
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`✅ [DEBUG] Found hotel: ${hotel.name} (${hotel.domain})`);
    console.log(`🔧 [DEBUG] PMS Type: ${hotel.pms_type}`);
    console.log(`🔧 [DEBUG] Cloudbeds Config:`, {
      hasClientId: !!hotel.cloudbeds_client_id,
      hasClientSecret: !!hotel.cloudbeds_client_secret,
      hasApiKey: !!hotel.cloudbeds_api_key,
      hasPropertyId: !!hotel.cloudbeds_property_id,
    });

    // Check if hotel has Cloudbeds configuration
    if (hotel.pms_type !== 'cloudbeds') {
      return new Response(
        JSON.stringify({
          error: 'Hotel is not configured for Cloudbeds',
          hotel: {
            id: hotel.id,
            name: hotel.name,
            domain: hotel.domain,
            pms_type: hotel.pms_type,
          },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if has required Cloudbeds credentials
    if (!hotel.cloudbeds_api_key && !hotel.cloudbeds_client_id) {
      return new Response(
        JSON.stringify({
          error: 'Hotel missing Cloudbeds credentials',
          hotel: {
            id: hotel.id,
            name: hotel.name,
            domain: hotel.domain,
            pms_type: hotel.pms_type,
          },
          missing_credentials: {
            api_key: !hotel.cloudbeds_api_key,
            client_id: !hotel.cloudbeds_client_id,
            client_secret: !hotel.cloudbeds_client_secret,
            property_id: !hotel.cloudbeds_property_id,
          },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    try {
      // Initialize booking service
      console.log(`🚀 [DEBUG] Initializing booking service...`);
      const bookingService = getBookingService();
      await bookingService.initializeForHotel(hotel);

      // Get the Cloudbeds engine
      const engine = bookingService.getEngine(String(hotel.id));
      if (!engine || !('debugCloudbedsRooms' in engine)) {
        return new Response(
          JSON.stringify({
            error: 'Cloudbeds engine not available or debug method not found',
            hotel: {
              id: hotel.id,
              name: hotel.name,
              domain: hotel.domain,
            },
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      console.log(`🔍 [DEBUG] Calling Cloudbeds API...`);

      // Debug Cloudbeds rooms, room types, and basic connectivity
      const engineWithDebug = engine as Record<string, unknown> & {
        debugCloudbedsRooms(): Promise<unknown>;
        debugCloudbedsRoomTypes(): Promise<unknown>;
        debugCloudbedsHotels(): Promise<unknown>;
      };
      const [roomsData, roomTypesData, hotelsData] = await Promise.allSettled([
        engineWithDebug.debugCloudbedsRooms(),
        engineWithDebug.debugCloudbedsRoomTypes(),
        engineWithDebug.debugCloudbedsHotels(),
      ]);

      const response = {
        success: true,
        hotel: {
          id: hotel.id,
          name: hotel.name,
          domain: hotel.domain,
          pms_type: hotel.pms_type,
        },
        cloudbeds_credentials: {
          has_api_key: !!hotel.cloudbeds_api_key,
          has_client_id: !!hotel.cloudbeds_client_id,
          has_client_secret: !!hotel.cloudbeds_client_secret,
          has_property_id: !!hotel.cloudbeds_property_id,
          property_id: hotel.cloudbeds_property_id, // Show actual property ID
        },
        cloudbeds_data: {
          hotels: {
            status: hotelsData.status,
            data: hotelsData.status === 'fulfilled' ? hotelsData.value : null,
            error:
              hotelsData.status === 'rejected'
                ? hotelsData.reason?.message
                : null,
          },
          rooms: {
            status: roomsData.status,
            data: roomsData.status === 'fulfilled' ? roomsData.value : null,
            error:
              roomsData.status === 'rejected'
                ? roomsData.reason?.message
                : null,
          },
          room_types: {
            status: roomTypesData.status,
            data:
              roomTypesData.status === 'fulfilled' ? roomTypesData.value : null,
            error:
              roomTypesData.status === 'rejected'
                ? roomTypesData.reason?.message
                : null,
          },
        },
        directus_rooms:
          hotel.rooms?.map((room) => ({
            id: room.id,
            name: room.name,
            description: room.description,
            cloudbeds_room_id: room.cloudbeds_room_id,
            bed_configuration: room.bed_configuration,
            size_sqm: room.size_sqm,
            amenities: room.amenities,
            is_accesible: room.is_accesible,
          })) || [],
        analysis: {
          directus_rooms_count: hotel.rooms?.length || 0,
          cloudbeds_rooms_count:
            roomsData.status === 'fulfilled' && roomsData.value?.data
              ? Array.isArray(roomsData.value.data)
                ? roomsData.value.data.length
                : 0
              : 0,
          mapping_strategy_recommendations: [
            '1. Check if Cloudbeds returns room_number or room_code fields',
            '2. Verify if room names in API match frontend display names',
            "3. Look for unique identifiers beyond just 'id'",
            '4. Consider mapping by multiple fields (name + bed_config + capacity)',
            '5. Implement manual mapping interface for edge cases',
          ],
        },
      };

      console.log(`✅ [DEBUG] Successfully fetched Cloudbeds data`);
      return new Response(JSON.stringify(response, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (initError) {
      console.error(
        '❌ [DEBUG] Failed to initialize or call Cloudbeds:',
        initError
      );
      return new Response(
        JSON.stringify({
          error: 'Failed to initialize Cloudbeds connection',
          details:
            initError instanceof Error ? initError.message : 'Unknown error',
          hotel: {
            id: hotel.id,
            name: hotel.name,
            domain: hotel.domain,
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('❌ [DEBUG] Debug rooms by ID error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to debug Cloudbeds rooms',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
