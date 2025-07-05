import type { APIRoute } from 'astro';

const DIRECTUS_URL = 'https://hotels.daotomata.io';
const DIRECTUS_TOKEN = 'rYncRSsu41KQQLvZYczPJyC8-8yzyED3';

interface ContactFormData {
  hotel_id: number;
  email: string;
  phone?: string;
  message: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body = await request.json() as ContactFormData;
    
    // Validate required fields
    if (!body.hotel_id || !body.email || !body.message) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Missing required fields: hotel_id, email, and message are required' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid email format' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate message length
    if (body.message.length < 10) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Message must be at least 10 characters long' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Prepare data for Directus
    const contactData = {
      hotel_id: body.hotel_id,
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim() || null,
      message: body.message.trim(),
      has_been_contacted: 'no', // Default value
    };

    console.log('📧 Submitting contact form to Directus:', {
      hotel_id: contactData.hotel_id,
      email: contactData.email,
      phone: contactData.phone ? 'provided' : 'not provided',
      message_length: contactData.message.length,
    });

    // Submit to Directus
    const directusResponse = await fetch(`${DIRECTUS_URL}/items/contact_form`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
      },
      body: JSON.stringify(contactData),
    });

    if (!directusResponse.ok) {
      const errorText = await directusResponse.text();
      console.error('❌ Directus API error:', {
        status: directusResponse.status,
        statusText: directusResponse.statusText,
        error: errorText,
      });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Failed to submit contact form. Please try again later.' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const result = await directusResponse.json();
    console.log('✅ Contact form submitted successfully:', {
      id: result.data?.id,
      hotel_id: contactData.hotel_id,
      email: contactData.email,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Contact form submitted successfully',
        id: result.data?.id 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Contact form API error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Internal server error. Please try again later.' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
