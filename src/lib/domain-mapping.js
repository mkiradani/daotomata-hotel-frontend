/**
 * Domain mapping utilities for subdomain-based routing
 * Maps subdomains to full hotel domains for Directus lookup
 */

/**
 * Maps subdomain from hostname to full hotel domain
 * @param {string} hostname - Full hostname (e.g., "maisondemo.daotomata.io")
 * @returns {string} - Full hotel domain for Directus lookup (e.g., "maisondemo.com")
 */
export function getHotelDomainFromHostname(hostname) {
  // Extract subdomain from hostname
  const subdomain = hostname.split('.')[0];

  // Static mapping of subdomains to actual hotel domains in Directus
  const domainMapping = {
    maisondemo: 'maisondemo.com',
    baberrih: 'baberrih.ma',
    demo: 'maisondemo.com', // Alias for demo
  };

  // Return mapped domain or construct default
  return domainMapping[subdomain] || `${subdomain}.daotomata.io`;
}

/**
 * Detects hotel domain from Astro request
 * Supports both new subdomain-based and legacy path-based detection
 * @param {URL} url - Astro.url object
 * @param {Object} params - Astro.params object (for legacy support)
 * @returns {string} - Hotel domain for Directus lookup
 */
export function getHotelDomainFromRequest(url, params = {}) {
  const hostname = url.hostname;

  // NEW: Subdomain-based detection (production with *.daotomata.io)
  if (hostname.includes('.daotomata.io') && hostname !== 'daotomata.io') {
    console.log(`🌐 Using subdomain-based detection: ${hostname}`);
    const domain = getHotelDomainFromHostname(hostname);
    console.log(
      `🔍 [DOMAIN-MAPPING] Subdomain routing - mapped domain: ${domain}`
    );
    return domain;
  }

  // LEGACY: Path-based detection (development and backward compatibility)
  if (params.hotel) {
    console.log(`🔗 Using legacy path-based detection: ${params.hotel}`);
    const subdomain = params.hotel;

    // Use same mapping logic
    const domainMapping = {
      maisondemo: 'maisondemo.com',
      baberrih: 'baberrih.ma',
      demo: 'maisondemo.com',
    };

    return domainMapping[subdomain] || `${subdomain}.daotomata.io`;
  }

  // FALLBACK: Default to first hotel for development
  console.log(`⚠️ No hotel detection method worked, using fallback`);
  return 'maisondemo.com';
}

/**
 * Gets subdomain from hostname for theme and other purposes
 * @param {string} hostname - Full hostname
 * @returns {string} - Subdomain part
 */
export function getSubdomainFromHostname(hostname) {
  return hostname.split('.')[0];
}

/**
 * Gets hotel slug from hostname for URL rewriting
 * @param {string} hostname - Full hostname (e.g., "maisondemo.daotomata.io")
 * @returns {string} - Hotel slug for URL paths (e.g., "maisondemo")
 */
export function getHotelSlugFromHostname(hostname) {
  const subdomain = hostname.split('.')[0];

  // Static mapping of subdomains to URL slugs
  const slugMapping = {
    maisondemo: 'maisondemo',
    baberrih: 'baberrih',
    demo: 'maisondemo', // Alias for demo
  };

  // Return mapped slug or use subdomain directly
  return slugMapping[subdomain] || subdomain;
}

/**
 * Checks if current request is using subdomain-based routing
 * @param {string} hostname - Full hostname
 * @returns {boolean} - True if using subdomain-based routing
 */
export function isSubdomainBasedRouting(hostname) {
  console.log(
    `🔍 [DOMAIN-MAPPING] isSubdomainBasedRouting called with: ${hostname}`
  );
  const result =
    hostname.includes('.daotomata.io') && hostname !== 'daotomata.io';
  console.log(`🔍 [DOMAIN-MAPPING] isSubdomainBasedRouting result: ${result}`);
  return result;
}

/**
 * Debug function to log detection results
 * @param {URL} url - Astro.url object
 * @param {Object} params - Astro.params object
 */
export function debugHotelDetection(url, params = {}) {
  const hostname = url.hostname;
  const isSubdomain = isSubdomainBasedRouting(hostname);
  const detectedDomain = getHotelDomainFromRequest(url, params);

  console.log('🔍 Hotel Detection Debug:', {
    hostname,
    pathname: url.pathname,
    params,
    isSubdomainBased: isSubdomain,
    detectedDomain,
    subdomain: isSubdomain ? getSubdomainFromHostname(hostname) : params.hotel,
  });

  return {
    hostname,
    isSubdomainBased: isSubdomain,
    detectedDomain,
    subdomain: isSubdomain ? getSubdomainFromHostname(hostname) : params.hotel,
  };
}
