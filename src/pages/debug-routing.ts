/**
 * Debug routing endpoint to test SSR functionality
 * This should be accessible at /debug-routing
 */

// Ensure this endpoint is not prerendered in SSR mode
export const prerender = false;

export async function GET(context: { url?: URL; request?: Request }) {
  try {
    console.log(`🔍 [DEBUG-ROUTING] === DEBUG ROUTING ACCESSED ===`);
    console.log(`🔍 [DEBUG-ROUTING] URL: ${context.url?.href || 'unknown'}`);
    console.log(
      `🔍 [DEBUG-ROUTING] Hostname: ${context.url?.hostname || 'unknown'}`
    );
    console.log(
      `🔍 [DEBUG-ROUTING] Pathname: ${context.url?.pathname || 'unknown'}`
    );
    console.log(
      `🔍 [DEBUG-ROUTING] Search: ${context.url?.search || 'unknown'}`
    );
    console.log(
      `🔍 [DEBUG-ROUTING] Request method: ${context.request?.method || 'unknown'}`
    );
    console.log(
      `🔍 [DEBUG-ROUTING] User-Agent: ${context.request?.headers?.get('user-agent') || 'unknown'}`
    );
    console.log(
      `🔍 [DEBUG-ROUTING] Referer: ${context.request?.headers?.get('referer') || 'unknown'}`
    );

    // Test domain mapping functions
    const { isSubdomainBasedRouting, getHotelDomainFromRequest } = await import(
      '../lib/domain-mapping.js'
    );

    const hostname = context.url?.hostname || 'unknown';
    const isSubdomain = isSubdomainBasedRouting(hostname);
    const hotelDomain = context.url
      ? getHotelDomainFromRequest(context.url, {})
      : 'unknown';

    console.log(`🔍 [DEBUG-ROUTING] isSubdomain: ${isSubdomain}`);
    console.log(`🔍 [DEBUG-ROUTING] hotelDomain: ${hotelDomain}`);

    const debugData = {
      status: 'debug-routing-working',
      timestamp: new Date().toISOString(),
      request: {
        url: context.url?.href,
        hostname: context.url?.hostname,
        pathname: context.url?.pathname,
        search: context.url?.search,
        method: context.request?.method,
        userAgent: context.request?.headers?.get('user-agent'),
        referer: context.request?.headers?.get('referer'),
      },
      routing: {
        isSubdomain,
        hotelDomain,
        detectedFromHostname: hostname,
      },
      server: {
        platform: process.platform,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        cwd: process.cwd(),
      },
    };

    console.log(`🔍 [DEBUG-ROUTING] Returning debug data successfully`);

    return new Response(JSON.stringify(debugData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('🔍 [DEBUG-ROUTING] Debug routing failed:', error);

    return new Response(
      JSON.stringify(
        {
          status: 'debug-routing-error',
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace',
          timestamp: new Date().toISOString(),
        },
        null,
        2
      ),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}
