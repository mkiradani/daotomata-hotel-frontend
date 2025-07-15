/**
 * API endpoint to process payment for a reservation
 * Used by frontend components: PaymentForm, CheckoutProcess
 */

import type { APIRoute } from 'astro';
import { getCurrentHotel } from '../../../lib/directus.js';
import { getBookingEngineFactory } from '../../../lib/booking-engines/factory.js';
import type { IBookingEngine } from '../../../lib/booking-engines/types.ts';
import type { Hotel } from '../../../types/hotel.js';
import type { CloudbedsPaymentRequest } from '../../../types/cloudbeds-api.js';

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('🔍 [API] Processing payment request...');

    // Parse request body
    const paymentData = (await request.json()) as CloudbedsPaymentRequest;

    // Validate required fields
    if (
      !paymentData.reservation_id ||
      !paymentData.amount ||
      !paymentData.currency ||
      !paymentData.payment_method_id
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required payment fields',
          code: 'INVALID_PAYMENT_DATA',
          required_fields: [
            'reservation_id',
            'amount',
            'currency',
            'payment_method_id',
          ],
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(
      `🔍 [API] Payment request: Reservation ${paymentData.reservation_id}, Amount: ${paymentData.amount} ${paymentData.currency}`
    );

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

    // Process payment through the booking engine
    const paymentResult = await (
      engine as IBookingEngine & {
        processPayment(data: unknown): Promise<unknown>;
      }
    ).processPayment(paymentData);

    console.log('✅ [API] Payment processed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        data: paymentResult,
        hotel: {
          id: hotel.id,
          name: hotel.name,
          pms_type: hotel.pms_type,
        },
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ [API] Payment processing failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error ? error.message : 'Payment processing failed',
        code: 'PAYMENT_PROCESSING_ERROR',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
