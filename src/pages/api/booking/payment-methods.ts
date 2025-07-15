/**
 * API endpoint to get available payment methods for the current hotel
 * Used by frontend components: PaymentMethodSelector, CheckoutForm
 */

import type { APIRoute } from 'astro';
import { getCurrentHotel } from '../../../lib/directus.js';
import { getBookingEngineFactory } from '../../../lib/booking-engines/factory.js';
import type { Hotel } from '../../../types/hotel.js';

export const GET: APIRoute = async () => {
  try {
    console.log("🔍 [API] Fetching payment methods for current hotel...");

    // Get current hotel from Directus (single-tenant)
    const hotel = await getCurrentHotel() as Hotel | null;
    
    if (!hotel) {
      return new Response(JSON.stringify({
        success: false,
        error: "Hotel not found",
        code: "HOTEL_NOT_FOUND"
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if hotel has PMS configuration
    if (!hotel.pms_type) {
      return new Response(JSON.stringify({
        success: false,
        error: "Hotel PMS not configured",
        code: "PMS_NOT_CONFIGURED"
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`🔍 [API] Hotel: ${hotel.name} (PMS: ${hotel.pms_type})`);

    // Create booking engine for the hotel
    const factory = getBookingEngineFactory();
    const engine = await factory.createFromHotelConfig(hotel);

    // Get payment methods from the booking engine
    const paymentMethods = await (engine as any).getPaymentMethods();
    
    console.log("✅ [API] Payment methods retrieved successfully");

    return new Response(JSON.stringify({
      success: true,
      data: paymentMethods,
      hotel: {
        id: hotel.id,
        name: hotel.name,
        pms_type: hotel.pms_type
      },
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });

  } catch (error) {
    console.error("❌ [API] Failed to fetch payment methods:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch payment methods',
      code: "PAYMENT_METHODS_ERROR",
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
