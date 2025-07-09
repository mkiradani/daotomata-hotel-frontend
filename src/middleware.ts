/**
 * Astro middleware for debugging SSR routing issues
 * This will log every request that hits the server
 */

import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
  console.log(`🔍 [ASTRO-MIDDLEWARE] === REQUEST INTERCEPTED ===`);
  console.log(`🔍 [ASTRO-MIDDLEWARE] URL: ${context.url.href}`);
  console.log(`🔍 [ASTRO-MIDDLEWARE] Method: ${context.request.method}`);
  console.log(`🔍 [ASTRO-MIDDLEWARE] Pathname: ${context.url.pathname}`);
  console.log(`🔍 [ASTRO-MIDDLEWARE] Hostname: ${context.url.hostname}`);
  console.log(`🔍 [ASTRO-MIDDLEWARE] Search: ${context.url.search}`);
  console.log(
    `🔍 [ASTRO-MIDDLEWARE] User-Agent: ${context.request.headers.get('user-agent') || 'unknown'}`
  );
  console.log(
    `🔍 [ASTRO-MIDDLEWARE] Referer: ${context.request.headers.get('referer') || 'unknown'}`
  );

  // Continue to the next middleware or route handler
  return next();
});
