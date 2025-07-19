import type { APIRoute } from 'astro';
import { getCurrentHotel } from '../../../lib/directus.js';

// Define hotel type to avoid TypeScript errors
interface Hotel {
  id: number;
  name: string;
  domain: string;
  cloudbeds_booking_url_id?: string;
}

export const POST: APIRoute = async ({ request }) => {
  console.log('🔗 [API] Redirect URL request received');

  try {
    const body = await request.json();
    console.log('🔗 [API] Request body:', JSON.stringify(body, null, 2));

    const { checkIn, checkOut, adults, children, rooms } = body;

    // Validate required parameters
    if (!checkIn || !checkOut || !adults) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameters: checkIn, checkOut, adults',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get hotel configuration
    console.log('🏨 Loading current hotel...');
    const hotel = (await getCurrentHotel()) as Hotel | null;

    if (!hotel) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Hotel configuration not found',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ [API] Hotel loaded:', hotel.name, 'ID:', hotel.id);

    // Check if hotel has Cloudbeds booking URL ID configured
    if (!hotel.cloudbeds_booking_url_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Hotel does not have Cloudbeds booking URL configured',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Build Cloudbeds redirect URL
    const baseUrl = 'https://hotels.cloudbeds.com/en/reservas';
    const bookingUrlId = hotel.cloudbeds_booking_url_id;

    // Build URL parameters
    const urlParams = new URLSearchParams({
      checkin: checkIn,
      checkout: checkOut,
      adults: adults.toString(),
      currency: 'usd', // Default currency, could be configurable
    });

    // Add children parameter if specified
    if (children && children > 0) {
      urlParams.append('children', children.toString());
    }

    // Add rooms parameter if specified and > 1
    if (rooms && rooms > 1) {
      urlParams.append('rooms', rooms.toString());
    }

    const redirectUrl = `${baseUrl}/${bookingUrlId}?${urlParams.toString()}`;

    console.log('🔗 [API] Generated redirect URL:', redirectUrl);

    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl,
        hotel: {
          id: hotel.id,
          name: hotel.name,
          domain: hotel.domain,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('🚨 [API] Redirect URL error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
