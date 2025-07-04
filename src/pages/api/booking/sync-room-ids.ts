/**
 * API endpoint for synchronizing PMS room IDs between Directus and Cloudbeds
 */

import type { APIRoute } from 'astro';
import { getHotelByDomain } from '../../../lib/directus.js';
import { getBookingService, RoomMappingService } from '../../../lib/booking-engines';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { hotelDomain, autoUpdate = false } = body;

    if (!hotelDomain) {
      return new Response(JSON.stringify({ error: 'Missing required parameter: hotelDomain' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get hotel data with rooms
    const hotel = await getHotelByDomain(hotelDomain);
    if (!hotel) {
      return new Response(JSON.stringify({ error: 'Hotel not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Initialize booking service
    const bookingService = getBookingService();
    await bookingService.initializeForHotel(hotel);

    // Get mapping statistics
    const mappingStats = bookingService.getRoomMappingStats(hotel.id);
    const mappedRooms = bookingService.getMappedRooms(hotel.id);

    if (!mappingStats || !mappedRooms) {
      return new Response(JSON.stringify({ error: 'Failed to get room mapping data' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Prepare sync recommendations
    const syncRecommendations = [];
    const directusRooms = hotel.rooms || [];

    for (const mappedRoom of mappedRooms) {
      const directusRoom = directusRooms.find((r) => r.id === mappedRoom.directusId);

      if (directusRoom && !directusRoom.cloudbeds_room_id) {
        syncRecommendations.push({
          directusRoomId: mappedRoom.directusId,
          directusRoomName: mappedRoom.name,
          suggestedPmsRoomId: mappedRoom.cloudbedsId,
          cloudbedsRoomName: mappedRoom.cloudbedsData.name,
          confidence: 'high', // Since it's already mapped
        });
      }
    }

    // If autoUpdate is true, update the rooms in Directus
    const updatedRooms = [];
    if (autoUpdate && syncRecommendations.length > 0) {
      try {
        // Import Directus client
        const { directus } = await import('../../../lib/directus.js');

        for (const recommendation of syncRecommendations) {
          try {
            await directus.request(
              // @ts-ignore - Directus types
              directus.updateItem('rooms', recommendation.directusRoomId, {
                cloudbeds_room_id: recommendation.suggestedPmsRoomId,
              })
            );

            updatedRooms.push({
              roomId: recommendation.directusRoomId,
              roomName: recommendation.directusRoomName,
              cloudbedsRoomId: recommendation.suggestedPmsRoomId,
              status: 'updated',
            });
          } catch (updateError) {
            updatedRooms.push({
              roomId: recommendation.directusRoomId,
              roomName: recommendation.directusRoomName,
              cloudbedsRoomId: recommendation.suggestedPmsRoomId,
              status: 'error',
              error: updateError instanceof Error ? updateError.message : 'Unknown error',
            });
          }
        }
      } catch (error) {
        console.error('Failed to update rooms:', error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        hotel: {
          id: hotel.id,
          name: hotel.name,
          domain: hotel.domain,
        },
        mappingStats,
        syncRecommendations,
        updatedRooms: autoUpdate ? updatedRooms : [],
        summary: {
          totalRooms: mappingStats.totalDirectusRooms,
          mappedRooms: mappingStats.mappedRooms,
          roomsNeedingSync: syncRecommendations.length,
          roomsUpdated: autoUpdate ? updatedRooms.filter((r) => r.status === 'updated').length : 0,
          roomsWithErrors: autoUpdate ? updatedRooms.filter((r) => r.status === 'error').length : 0,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Room sync error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to sync room IDs',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const hotelDomain = searchParams.get('hotelDomain');

    if (!hotelDomain) {
      return new Response(JSON.stringify({ error: 'Missing required parameter: hotelDomain' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get hotel data with rooms
    const hotel = await getHotelByDomain(hotelDomain);
    if (!hotel) {
      return new Response(JSON.stringify({ error: 'Hotel not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Initialize booking service
    const bookingService = getBookingService();
    await bookingService.initializeForHotel(hotel);

    // Get current sync status
    const mappingStats = bookingService.getRoomMappingStats(hotel.id);
    const directusRooms = hotel.rooms || [];

    const syncStatus = {
      totalRooms: directusRooms.length,
      roomsWithPmsId: directusRooms.filter((r) => r.pms_room_id).length,
      roomsWithoutPmsId: directusRooms.filter((r) => !r.pms_room_id).length,
      mappingCoverage: mappingStats
        ? (mappingStats.mappedRooms / mappingStats.totalDirectusRooms) * 100
        : 0,
    };

    return new Response(
      JSON.stringify({
        success: true,
        hotel: {
          id: hotel.id,
          name: hotel.name,
          domain: hotel.domain,
        },
        syncStatus,
        mappingStats,
        rooms: directusRooms.map((room) => ({
          id: room.id,
          name: room.name,
          room_type: room.room_type,
          pms_room_id: room.pms_room_id,
          hasPmsId: !!room.pms_room_id,
        })),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Room sync status error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to get room sync status',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
