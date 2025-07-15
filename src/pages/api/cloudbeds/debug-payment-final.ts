/**
 * Debug final con los parámetros correctos identificados
 */

import type { APIRoute } from 'astro';
import { getCurrentHotel } from '../../../lib/directus.js';
import type { Hotel } from '../../../types/hotel.js';

export const GET: APIRoute = async () => {
  try {
    console.log("🔍 [DEBUG FINAL] Probando con parámetros correctos identificados...");

    const hotel = await getCurrentHotel() as Hotel | null;
    
    if (!hotel || hotel.pms_type !== 'cloudbeds') {
      return new Response(JSON.stringify({
        success: false,
        error: "Hotel Cloudbeds no encontrado"
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // PRUEBA FINAL: Usando type = "credit" (del getPaymentMethods)
    console.log("🧪 [PRUEBA FINAL] type = 'credit' con parámetros completos");
    
    const finalData = new URLSearchParams();
    finalData.append('reservationID', 'test_reservation_123');
    finalData.append('amount', '150.00');
    finalData.append('currency', 'USD');
    finalData.append('paymentMethodID', 'cards');
    finalData.append('type', 'credit'); // Usando el tipo correcto del getPaymentMethods
    finalData.append('description', 'Test payment with correct type');

    let finalResult;
    try {
      const response = await fetch(`https://api.cloudbeds.com/api/v1.3/postPayment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Bearer ${hotel.cloudbeds_api_key}`,
          "x-property-id": hotel.cloudbeds_property_id || "",
        },
        body: finalData.toString()
      });
      
      const responseText = await response.text();
      finalResult = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText
      };
      
      console.log("✅ [FINAL] Response status:", response.status);
      console.log("✅ [FINAL] Response body:", responseText);
      
    } catch (error) {
      finalResult = { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }

    // También probar con variaciones del paymentMethodID
    console.log("🧪 [PRUEBA ADICIONAL] Probando con paymentMethodID = 'visa'");
    
    const visaData = new URLSearchParams();
    visaData.append('reservationID', 'test_reservation_123');
    visaData.append('amount', '150.00');
    visaData.append('currency', 'USD');
    visaData.append('paymentMethodID', 'visa'); // Usando código específico de tarjeta
    visaData.append('type', 'credit');

    let visaResult;
    try {
      const response = await fetch(`https://api.cloudbeds.com/api/v1.3/postPayment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Bearer ${hotel.cloudbeds_api_key}`,
          "x-property-id": hotel.cloudbeds_property_id || "",
        },
        body: visaData.toString()
      });
      
      const responseText = await response.text();
      visaResult = {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      };
      
    } catch (error) {
      visaResult = { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Debug final con parámetros correctos completado",
      hotel: {
        id: hotel.id,
        name: hotel.name,
        property_id: hotel.cloudbeds_property_id
      },
      discovered_parameters: {
        content_type: "application/x-www-form-urlencoded",
        required_fields: ["reservationID", "amount", "type"],
        payment_type: "credit (from getPaymentMethods)",
        payment_method_options: ["cards", "visa", "master"]
      },
      tests: {
        credit_with_cards: {
          description: "type=credit, paymentMethodID=cards",
          payload: Object.fromEntries(finalData.entries()),
          result: finalResult
        },
        credit_with_visa: {
          description: "type=credit, paymentMethodID=visa",
          payload: Object.fromEntries(visaData.entries()),
          result: visaResult
        }
      },
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("❌ [DEBUG] Error:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
