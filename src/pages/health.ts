/**
 * Health check endpoint for SSR server
 * Used by Docker healthcheck and load balancers
 */

// Ensure this endpoint is not prerendered in SSR mode
export const prerender = false;

export async function GET(context) {
  try {
    console.log(`🔍 [HEALTH] === HEALTH CHECK ACCESSED ===`);
    console.log(`🔍 [HEALTH] URL: ${context.url?.href || 'unknown'}`);
    console.log(
      `🔍 [HEALTH] Request method: ${context.request?.method || 'unknown'}`
    );
    console.log(
      `🔍 [HEALTH] User-Agent: ${context.request?.headers?.get('user-agent') || 'unknown'}`
    );

    // Basic health check - server is responding
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.8.0-dev',
      serverInfo: {
        platform: process.platform,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        cwd: process.cwd(),
      },
    };

    console.log(`🔍 [HEALTH] Returning health data successfully`);

    return new Response(JSON.stringify(healthData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);

    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}
