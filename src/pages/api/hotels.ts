import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request: _request }) => {
  try {
    // For now, return the hotels data that we know exists
    // This will be replaced with actual MCP calls when the connection issue is resolved
    const hotels = [
      {
        id: 1,
        name: 'Maison Demo',
        domain: 'maisondemo.com',
        status: 'draft',
        avaliable_currencies: ['EUR', 'USD', 'GBP'],
        avaliable_lenguages: [2, 3],
        pms_type: 'cloudbeds',
      },
      {
        id: 2,
        name: 'Baberrih Hotel',
        domain: 'baberrih.ma',
        status: 'draft',
        avaliable_currencies: ['MAD', 'EUR', 'GBP', 'USD'],
        avaliable_lenguages: [4, 5, 6],
        pms_type: 'cloudbeds',
      },
    ];

    return new Response(JSON.stringify(hotels), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching hotels:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch hotels' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
