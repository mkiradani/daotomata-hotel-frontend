/**
 * Debug endpoint to inspect actual Cloudbeds room data structure
 */

import type { APIRoute } from "astro";
import { getBookingService } from "../../../lib/booking-engines";
import { getHotelByDomain } from "../../../lib/directus.js";
import type { Hotel } from "../../../types/hotel.js";

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const hotelDomain = searchParams.get("hotelDomain") || new URL(url).hostname;

    // Get hotel data
    const hotel = (await getHotelByDomain(hotelDomain)) as Hotel | null;
    if (!hotel) {
      return new Response(
        JSON.stringify({
          error: "Hotel not found",
          domain: hotelDomain,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Check if hotel has Cloudbeds configuration
    if (hotel.pms_type !== 'cloudbeds') {
      return new Response(
        JSON.stringify({
          error: "Hotel is not configured for Cloudbeds",
          pms_type: hotel.pms_type,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Initialize booking service
    const bookingService = getBookingService();
    await bookingService.initializeForHotel(hotel);

    // Get the Cloudbeds engine
    const engine = bookingService.getEngine(String(hotel.id));
    if (!engine || !('debugCloudbedsRooms' in engine)) {
      return new Response(
        JSON.stringify({
          error: "Cloudbeds engine not available or debug method not found",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Debug Cloudbeds rooms and room types
    const [roomsData, roomTypesData] = await Promise.allSettled([
      (engine as any).debugCloudbedsRooms(),
      (engine as any).debugCloudbedsRoomTypes(),
    ]);

    const response = {
      success: true,
      hotel: {
        id: hotel.id,
        name: hotel.name,
        domain: hotel.domain,
        pms_type: hotel.pms_type,
      },
      cloudbeds_data: {
        rooms: {
          status: roomsData.status,
          data: roomsData.status === 'fulfilled' ? roomsData.value : null,
          error: roomsData.status === 'rejected' ? roomsData.reason?.message : null,
        },
        room_types: {
          status: roomTypesData.status,
          data: roomTypesData.status === 'fulfilled' ? roomTypesData.value : null,
          error: roomTypesData.status === 'rejected' ? roomTypesData.reason?.message : null,
        },
      },
      directus_rooms: hotel.rooms?.map((room) => ({
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
        cloudbeds_rooms_count: roomsData.status === 'fulfilled' && roomsData.value?.data 
          ? Array.isArray(roomsData.value.data) ? roomsData.value.data.length : 0
          : 0,
        mapping_strategy_recommendations: [
          "1. Check if Cloudbeds returns room_number or room_code fields",
          "2. Verify if room names in API match frontend display names",
          "3. Look for unique identifiers beyond just 'id'",
          "4. Consider mapping by multiple fields (name + bed_config + capacity)",
          "5. Implement manual mapping interface for edge cases",
        ],
      },
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Debug rooms error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to debug Cloudbeds rooms",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
