/**
 * Debug específico para probar el parámetro 'type' en postPayment
 */

import type { APIRoute } from 'astro';
import { getCurrentHotel } from '../../../lib/directus.js';
import type { Hotel } from '../../../types/hotel.js';

export const GET: APIRoute = async () => {
  try {
    console.log("🔍 [DEBUG TYPE] Probando parámetro 'type' en postPayment...");

    const hotel = (await getCurrentHotel()) as Hotel | null;

    if (!hotel || hotel.pms_type !== 'cloudbeds') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Hotel Cloudbeds no encontrado',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const tests = [];

    // PRUEBA 1: type = "payment"
    console.log("🧪 [PRUEBA 1] type = 'payment'");
    const test1Data = new URLSearchParams();
    test1Data.append('reservationID', 'test_reservation_123');
    test1Data.append('amount', '150.00');
    test1Data.append('currency', 'USD');
    test1Data.append('paymentMethodID', 'cards');
    test1Data.append('type', 'payment');
    test1Data.append('description', 'Test payment');

    const test1 = await testPayment(hotel, test1Data, "type = 'payment'");
    tests.push(test1);

    // PRUEBA 2: type = "deposit"
    console.log("🧪 [PRUEBA 2] type = 'deposit'");
    const test2Data = new URLSearchParams();
    test2Data.append('reservationID', 'test_reservation_123');
    test2Data.append('amount', '150.00');
    test2Data.append('currency', 'USD');
    test2Data.append('paymentMethodID', 'cards');
    test2Data.append('type', 'deposit');

    const test2 = await testPayment(hotel, test2Data, "type = 'deposit'");
    tests.push(test2);

    // PRUEBA 3: type = "charge"
    console.log("🧪 [PRUEBA 3] type = 'charge'");
    const test3Data = new URLSearchParams();
    test3Data.append('reservationID', 'test_reservation_123');
    test3Data.append('amount', '150.00');
    test3Data.append('paymentMethodID', 'cards');
    test3Data.append('type', 'charge');

    const test3 = await testPayment(hotel, test3Data, "type = 'charge'");
    tests.push(test3);

    // PRUEBA 4: Parámetros mínimos con type
    console.log('🧪 [PRUEBA 4] Parámetros mínimos');
    const test4Data = new URLSearchParams();
    test4Data.append('reservationID', 'test_reservation_123');
    test4Data.append('amount', '150');
    test4Data.append('type', 'payment');

    const test4 = await testPayment(hotel, test4Data, 'Parámetros mínimos');
    tests.push(test4);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Debug de parámetro 'type' completado",
        hotel: {
          id: hotel.id,
          name: hotel.name,
          property_id: hotel.cloudbeds_property_id,
        },
        tests: tests,
        summary: {
          total_tests: tests.length,
          successful_tests: tests.filter(
            (t) =>
              t.result.status === 200 &&
              !t.result.body.includes('"success": false')
          ).length,
          errors_found: tests
            .map((t) => t.result.body)
            .filter((body) => body?.includes('"success": false')),
        },
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ [DEBUG] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

async function testPayment(
  hotel: Hotel,
  formData: URLSearchParams,
  description: string
) {
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

    return {
      description,
      payload: Object.fromEntries(formData.entries()),
      result: {
        status: response.status,
        statusText: response.statusText,
        body: responseText,
      },
    };
  } catch (error) {
    return {
      description,
      payload: Object.fromEntries(formData.entries()),
      result: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
