/**
 * Endpoint de debug exhaustivo para investigar parámetros exactos de postPayment
 */

import type { APIRoute } from 'astro';
import { getCurrentHotel } from '../../../lib/directus.js';
import { getBookingEngineFactory } from '../../../lib/booking-engines/factory.js';
import type { Hotel } from '../../../types/hotel.js';

export const GET: APIRoute = async () => {
  try {
    console.log(
      '🔍 [DEBUG EXHAUSTIVO] Iniciando investigación de postPayment...'
    );

    // Get current hotel from Directus (single-tenant)
    const hotel = (await getCurrentHotel()) as Hotel | null;

    if (!hotel || hotel.pms_type !== 'cloudbeds') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Hotel Cloudbeds no encontrado',
          timestamp: new Date().toISOString(),
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create booking engine
    const factory = getBookingEngineFactory();
    const _engine = await factory.createFromHotelConfig(hotel);

    console.log(
      `🔍 [DEBUG] Hotel: ${hotel.name} (Property ID: ${hotel.cloudbeds_property_id})`
    );

    // PRUEBA 1: Formato JSON (actual)
    console.log('🧪 [PRUEBA 1] Probando formato JSON...');
    const jsonPayload = {
      reservation_id: 'test_reservation_123',
      amount: 150.0,
      currency: 'USD',
      payment_method_id: 'cards',
      description: 'Test payment',
    };

    let jsonResult;
    try {
      const response = await fetch(
        `https://api.cloudbeds.com/api/v1.3/postPayment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${hotel.cloudbeds_api_key}`,
            'x-property-id': hotel.cloudbeds_property_id || '',
          },
          body: JSON.stringify(jsonPayload),
        }
      );

      const responseText = await response.text();
      jsonResult = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText,
      };
    } catch (error) {
      jsonResult = {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // PRUEBA 2: Formato form-urlencoded
    console.log('🧪 [PRUEBA 2] Probando formato form-urlencoded...');
    const formData = new URLSearchParams();
    formData.append('reservationID', 'test_reservation_123');
    formData.append('amount', '150.00');
    formData.append('currency', 'USD');
    formData.append('paymentMethodID', 'cards');
    formData.append('description', 'Test payment');

    let formResult;
    try {
      const response = await fetch(
        `https://api.cloudbeds.com/api/v1.3/postPayment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Bearer ${hotel.cloudbeds_api_key}`,
            'x-property-id': hotel.cloudbeds_property_id || '',
          },
          body: formData.toString(),
        }
      );

      const responseText = await response.text();
      formResult = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText,
      };
    } catch (error) {
      formResult = {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // PRUEBA 3: Formato con nombres alternativos
    console.log('🧪 [PRUEBA 3] Probando nombres de parámetros alternativos...');
    const altFormData = new URLSearchParams();
    altFormData.append('reservationId', 'test_reservation_123');
    altFormData.append('amount', '150');
    altFormData.append('paymentMethod', 'cards');

    let altResult;
    try {
      const response = await fetch(
        `https://api.cloudbeds.com/api/v1.3/postPayment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Bearer ${hotel.cloudbeds_api_key}`,
            'x-property-id': hotel.cloudbeds_property_id || '',
          },
          body: altFormData.toString(),
        }
      );

      const responseText = await response.text();
      altResult = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText,
      };
    } catch (error) {
      altResult = {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Debug exhaustivo de postPayment completado',
        hotel: {
          id: hotel.id,
          name: hotel.name,
          property_id: hotel.cloudbeds_property_id,
        },
        tests: {
          json_format: {
            description: 'Formato JSON con nombres actuales',
            payload: jsonPayload,
            result: jsonResult,
          },
          form_urlencoded: {
            description: 'Formato form-urlencoded con nombres estándar',
            payload: Object.fromEntries(formData.entries()),
            result: formResult,
          },
          alternative_names: {
            description: 'Formato form-urlencoded con nombres alternativos',
            payload: Object.fromEntries(altFormData.entries()),
            result: altResult,
          },
        },
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ [DEBUG] Error en debug exhaustivo:', error);

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
