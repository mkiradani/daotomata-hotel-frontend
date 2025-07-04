/**
 * API endpoint for diagnosing booking system configuration
 */

import type { APIRoute } from 'astro';
import { getHotelByDomain } from '../../../lib/directus.js';
import { hasBookingCapabilities } from '../../../lib/booking-engines';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const hotelDomain = searchParams.get('hotelDomain') || new URL(url).hostname;

    // Get hotel data
    const hotel = await getHotelByDomain(hotelDomain);
    if (!hotel) {
      return new Response(
        JSON.stringify({
          error: 'Hotel not found',
          domain: hotelDomain,
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check booking capabilities
    const hasCapabilities = hasBookingCapabilities(hotel);

    // Prepare diagnostic information
    const diagnostics = {
      hotel: {
        id: hotel.id,
        name: hotel.name,
        domain: hotel.domain,
        pms_type: hotel.pms_type,
      },
      configuration: {
        hasBookingCapabilities,
        cloudbeds: {
          client_id: hotel.cloudbeds_client_id ? '✅ Configured' : '❌ Missing',
          client_secret: hotel.cloudbeds_client_secret ? '✅ Configured' : '❌ Missing',
          api_key: hotel.cloudbeds_api_key ? '✅ Configured' : '❌ Missing',
          property_id: hotel.cloudbeds_property_id ? '✅ Configured' : '❌ Missing',
        },
        other: {
          default_currency: hotel.default_currency || 'Not set',
          default_language: hotel.default_language || 'Not set',
        },
      },
      rooms: {
        total: hotel.rooms ? hotel.rooms.length : 0,
        withPmsId: hotel.rooms ? hotel.rooms.filter((r) => r.pms_room_id).length : 0,
        withoutPmsId: hotel.rooms ? hotel.rooms.filter((r) => !r.pms_room_id).length : 0,
        list: hotel.rooms
          ? hotel.rooms.map((room) => ({
              id: room.id,
              name: room.name,
              room_type: room.room_type,
              pms_room_id: room.pms_room_id || 'Not set',
              max_occupancy: room.max_occupancy,
            }))
          : [],
      },
      issues: [],
      recommendations: [],
    };

    // Identify issues and recommendations
    if (!hasCapabilities) {
      diagnostics.issues.push('Hotel does not have booking capabilities configured');
      diagnostics.recommendations.push('Configure Cloudbeds credentials in Directus');
    }

    if (!hotel.cloudbeds_client_id) {
      diagnostics.issues.push('Missing Cloudbeds Client ID');
      diagnostics.recommendations.push('Set cloudbeds_client_id field in hotels table');
    }

    if (!hotel.cloudbeds_client_secret) {
      diagnostics.issues.push('Missing Cloudbeds Client Secret');
      diagnostics.recommendations.push('Set cloudbeds_client_secret field in hotels table');
    }

    if (!hotel.cloudbeds_api_key) {
      diagnostics.issues.push('Missing Cloudbeds API Key');
      diagnostics.recommendations.push('Set cloudbeds_api_key field in hotels table');
    }

    if (!hotel.cloudbeds_property_id) {
      diagnostics.issues.push('Missing Cloudbeds Property ID');
      diagnostics.recommendations.push('Set cloudbeds_property_id field in hotels table');
    }

    if (hotel.rooms && hotel.rooms.length === 0) {
      diagnostics.issues.push('No rooms configured');
      diagnostics.recommendations.push('Add rooms to the hotel in Directus');
    }

    if (hotel.rooms && diagnostics.rooms.withoutPmsId > 0) {
      diagnostics.issues.push(`${diagnostics.rooms.withoutPmsId} rooms missing PMS room IDs`);
      diagnostics.recommendations.push('Use the room sync functionality to map room IDs');
    }

    // Test connection if all credentials are present
    let connectionTest = null;
    if (hasCapabilities) {
      try {
        // Try to initialize the booking service
        const { getBookingService } = await import('../../../lib/booking-engines');
        const bookingService = getBookingService();
        await bookingService.initializeForHotel(hotel);

        connectionTest = {
          status: 'success',
          message: 'Successfully initialized booking service',
        };
      } catch (error) {
        connectionTest = {
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
          error: error instanceof Error ? error.stack : undefined,
        };
        diagnostics.issues.push(`Connection test failed: ${connectionTest.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        diagnostics,
        connectionTest,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Booking diagnostics error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to run diagnostics',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { hotelDomain, action } = body;

    if (!hotelDomain) {
      return new Response(JSON.stringify({ error: 'Missing hotelDomain parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get hotel data
    const hotel = await getHotelByDomain(hotelDomain);
    if (!hotel) {
      return new Response(JSON.stringify({ error: 'Hotel not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let result = null;

    switch (action) {
      case 'test-connection':
        try {
          const { getBookingService } = await import('../../../lib/booking-engines');
          const bookingService = getBookingService();
          await bookingService.initializeForHotel(hotel);

          result = {
            status: 'success',
            message: 'Connection successful',
            timestamp: new Date().toISOString(),
          };
        } catch (error) {
          result = {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          };
        }
        break;

      case 'test-availability':
        try {
          const { getBookingService } = await import('../../../lib/booking-engines');
          const bookingService = getBookingService();
          await bookingService.initializeForHotel(hotel);

          // Test with sample dates
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const dayAfter = new Date();
          dayAfter.setDate(dayAfter.getDate() + 2);

          const availability = await bookingService.checkAvailability(hotel.id, {
            checkIn: tomorrow.toISOString().split('T')[0],
            checkOut: dayAfter.toISOString().split('T')[0],
            adults: 2,
          });

          result = {
            status: 'success',
            message: 'Availability check successful',
            data: availability,
            timestamp: new Date().toISOString(),
          };
        } catch (error) {
          result = {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          };
        }
        break;

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        result,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Booking diagnostics action error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to execute action',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
