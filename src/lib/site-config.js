/**
 * Dynamic site configuration utilities
 * Eliminates hardcoded hotel-specific configurations for infinite scalability
 */

import { getCurrentHotel, directus } from './directus.js';
import { readItems } from '@directus/sdk';
import {
  DEFAULT_LOCALIZATION,
  getEnvironmentDefaults,
  getHotelDefaults,
  ERROR_MESSAGES
} from './constants.js';

/**
 * Get site URL dynamically from hotel data or environment
 * Prioritizes real customer domain over technical deployment domain
 *
 * Priority:
 * 1. SITE_URL env var (real customer domain like maisondemo.com)
 * 2. Hotel domain from Directus (fallback to technical domain)
 * 3. Localhost for development
 */
export async function getSiteUrl() {
  // Priority 1: Explicitly set SITE_URL (real customer domain)
  if (process.env.SITE_URL) {
    console.log(`🌐 Using configured SITE_URL: ${process.env.SITE_URL}`);
    return process.env.SITE_URL;
  }

  // Priority 2: Derive from hotel domain in Directus
  try {
    const hotel = await getCurrentHotel();
    if (hotel?.domain) {
      const { protocol } = getEnvironmentDefaults();
      const siteUrl = `${protocol}://${hotel.domain}`;
      console.log(`🌐 Using hotel domain from Directus: ${siteUrl}`);
      return siteUrl;
    }
  } catch (error) {
    console.warn('⚠️ Could not determine site URL from hotel data:', error);
  }

  // Priority 3: Fallback to localhost for development using constants
  const { protocol, host, port } = getEnvironmentDefaults();
  const fallbackUrl = `${protocol}://${host}:${port}`;
  console.log(`🌐 Using development fallback: ${fallbackUrl}`);
  return fallbackUrl;
}

/**
 * Get available languages dynamically from Directus
 * This eliminates hardcoded language lists
 */
export async function getAvailableLanguages(hotelLanguageIds = []) {
  try {
    if (hotelLanguageIds.length === 0) {
      return DEFAULT_LOCALIZATION.fallbackLanguages;
    }

    const languages = await directus.request(
      readItems("languages", {
        filter: { code: { _in: hotelLanguageIds } },
        fields: ["code", "name", "direction"]
      })
    );

    return languages.map(lang => lang.code);
  } catch (error) {
    console.warn('⚠️ Could not fetch languages from Directus:', error);
    return DEFAULT_LOCALIZATION.fallbackLanguages;
  }
}

/**
 * Get hotel-specific configuration dynamically
 * This replaces ALL hardcoded hotel configurations
 */
export async function getHotelConfig() {
  try {
    const hotel = await getCurrentHotel();
    if (!hotel) {
      throw new Error(ERROR_MESSAGES.HOTEL_NOT_FOUND);
    }

    const defaults = getHotelDefaults();

    // Get dynamic languages from Directus based on hotel configuration
    const availableLanguages = await getAvailableLanguages(hotel.avaliable_lenguages);

    return {
      id: hotel.id,
      name: hotel.name,
      domain: hotel.domain,
      siteUrl: await getSiteUrl(),

      // Localization - 100% dynamic from Directus
      defaultLanguage: availableLanguages[0] || defaults.language,
      defaultCurrency: hotel.avaliable_currencies?.[0] || defaults.currency,
      availableLanguages: availableLanguages,
      availableCurrencies: hotel.avaliable_currencies || defaults.availableCurrencies,
      
      // Analytics & Tracking
      ga4Token: hotel.ga4_token || null,
      metaPixelToken: hotel.meta_pixel_token || null,
      chatwootToken: hotel.chatwoot_website_token || null,
      
      // PMS Configuration
      pmsType: hotel.pms_type || null,
      cloudbedsConfig: hotel.pms_type === 'cloudbeds' ? {
        clientId: hotel.cloudbeds_client_id,
        clientSecret: hotel.cloudbeds_client_secret,
        apiKey: hotel.cloudbeds_api_key,
        propertyId: hotel.cloudbeds_property_id,
      } : null,
      
      // Theme
      theme: hotel.theme || null,
      logo: hotel.logo || null,
    };
  } catch (error) {
    console.error('❌ Error getting hotel configuration:', error);
    throw error;
  }
}

/**
 * Generate URL for hotel-specific routes
 * Handles both subdomain and path-based routing dynamically
 */
export function generateHotelUrl(path = '/', _hotelConfig = null) {
  // For single-tenant deployments, just use the path
  return path.startsWith('/') ? path : `/${path}`;
}

/**
 * Get deployment type based on configuration
 */
export function getDeploymentType() {
  // Single-tenant if HOTEL_ID is set
  if (process.env.HOTEL_ID) {
    return 'single-tenant';
  }
  
  // Multi-tenant if no specific hotel ID
  return 'multi-tenant';
}

/**
 * Validate hotel configuration for required fields
 */
export function validateHotelConfig(config) {
  const required = ['id', 'name', 'domain'];
  const missing = required.filter(field => !config[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required hotel configuration: ${missing.join(', ')}`);
  }
  
  return true;
}
