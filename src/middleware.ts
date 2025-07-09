/**
 * Astro middleware for subdomain routing with URL rewriting
 * Transforms subdomain requests to path-based requests for Astro SSR dynamic routes
 */

import { defineMiddleware } from 'astro:middleware';
import {
  isSubdomainBasedRouting,
  getHotelSlugFromHostname,
} from './lib/domain-mapping.js';

export const onRequest = defineMiddleware((context, next) => {
  const { url, request } = context;

  console.log(`🔍 [MIDDLEWARE] === REQUEST INTERCEPTED ===`);
  console.log(`🔍 [MIDDLEWARE] Original URL: ${url.href}`);
  console.log(`🔍 [MIDDLEWARE] Method: ${request.method}`);
  console.log(`🔍 [MIDDLEWARE] Pathname: ${url.pathname}`);
  console.log(`🔍 [MIDDLEWARE] Hostname: ${url.hostname}`);

  // Check if this is a subdomain-based request
  if (isSubdomainBasedRouting(url.hostname)) {
    const hotelSlug = getHotelSlugFromHostname(url.hostname);

    // Skip rewriting for static assets, API endpoints, and special routes
    if (
      url.pathname.startsWith('/_astro/') ||
      url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/favicon') ||
      url.pathname === '/health' ||
      url.pathname === '/debug-routing' ||
      url.pathname.includes('.')
    ) {
      console.log(
        `🔍 [MIDDLEWARE] Skipping rewrite for static/special route: ${url.pathname}`
      );
      return next();
    }

    // Rewrite URL to include hotel slug in path for Astro dynamic routing
    const originalPathname = url.pathname;
    const newPathname = `/${hotelSlug}${originalPathname === '/' ? '' : originalPathname}`;

    console.log(`🔍 [MIDDLEWARE] REWRITING URL:`);
    console.log(`🔍 [MIDDLEWARE] Hotel slug: ${hotelSlug}`);
    console.log(`🔍 [MIDDLEWARE] Original pathname: ${originalPathname}`);
    console.log(`🔍 [MIDDLEWARE] New pathname: ${newPathname}`);

    // Create new URL with rewritten path
    const rewrittenUrl = new URL(newPathname + url.search, url.origin);

    console.log(`🔍 [MIDDLEWARE] Rewritten URL: ${rewrittenUrl.href}`);

    // Use context.rewrite to internally rewrite the URL
    return context.rewrite(rewrittenUrl);
  }

  console.log(`🔍 [MIDDLEWARE] No rewrite needed - continuing to next()`);
  return next();
});
