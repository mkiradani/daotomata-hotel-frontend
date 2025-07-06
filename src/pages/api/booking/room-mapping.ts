/**
 * API endpoint for room mapping statistics and management
 */

import type { APIRoute } from "astro";
import { getBookingService } from "../../../lib/booking-engines";
import { getHotelByDomain } from "../../../lib/directus.js";
import type { Hotel } from "../../../types/hotel.js";

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const hotelDomain = searchParams.get("hotelDomain");

    if (!hotelDomain) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: hotelDomain" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get hotel data with rooms
    const hotel = (await getHotelByDomain(hotelDomain)) as Hotel | null;
    if (!hotel) {
      return new Response(JSON.stringify({ error: "Hotel not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Initialize booking service
    const bookingService = getBookingService();
    await bookingService.initializeForHotel(hotel);

    // Get mapping statistics
    const mappingStats = bookingService.getRoomMappingStats(String(hotel.id));
    const mappedRooms = bookingService.getMappedRooms(String(hotel.id));

    return new Response(
      JSON.stringify({
        success: true,
        hotel: {
          id: hotel.id,
          name: hotel.name,
          domain: hotel.domain,
        },
        mappingStats,
        mappedRooms,
        directusRooms:
          hotel.rooms?.map((room) => ({
            id: room.id,
            name: room.name,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            room_type: (room as any).room_type,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            max_occupancy: (room as any).max_occupancy,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pms_room_id: (room as any).pms_room_id,
          })) || [],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Room mapping error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to get room mapping information",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
