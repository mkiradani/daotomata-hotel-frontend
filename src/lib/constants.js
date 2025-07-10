/**
 * Application constants and defaults
 * Centralized configuration to eliminate hardcoding throughout the application
 */

// Default localization settings - NEVER hardcode specific hotel values
export const DEFAULT_LOCALIZATION = {
  language: 'en-US',
  currency: 'USD',

  // Fallback languages if hotel has no configuration
  fallbackLanguages: ['en-US'],

  // Fallback currencies if hotel has no configuration
  fallbackCurrencies: ['USD']
};

// Default API endpoints and services
export const DEFAULT_SERVICES = {
  directusUrl: 'https://hotels.daotomata.io',
  defaultHotelId: '1',
  
  // Development settings
  devPort: 4321,
  devHost: 'localhost',
  
  // Production settings
  prodProtocol: 'https',
  devProtocol: 'http'
};

// PMS (Property Management System) configurations
export const PMS_TYPES = {
  CLOUDBEDS: 'cloudbeds',
  BOOKING_COM: 'booking.com',
  EXPEDIA: 'expedia',
  AIRBNB: 'airbnb',
  CUSTOM: 'custom'
};

// Hotel status types
export const HOTEL_STATUS = {
  PUBLISHED: 'published',
  DRAFT: 'draft',
  ARCHIVED: 'archived'
};

// Deployment types
export const DEPLOYMENT_TYPES = {
  SINGLE_TENANT: 'single-tenant',
  MULTI_TENANT: 'multi-tenant'
};

// Media and asset defaults
export const MEDIA_DEFAULTS = {
  imageQuality: 90,
  heroImageDimensions: { width: 1920, height: 1080 },
  logoImageDimensions: { width: 180, height: 180 },
  thumbnailDimensions: { width: 400, height: 300 },
  
  // Supported image formats
  supportedFormats: ['png', 'jpg', 'jpeg', 'webp', 'avif']
};

// Theme and styling defaults
export const THEME_DEFAULTS = {
  defaultTheme: 'light',
  colorScheme: 'light',
  prefersDark: false
};

// Validation rules
export const VALIDATION_RULES = {
  hotelName: {
    minLength: 2,
    maxLength: 100
  },
  domain: {
    pattern: /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/
  },
  hotelId: {
    min: 1,
    max: 999999
  }
};

// Error messages
export const ERROR_MESSAGES = {
  HOTEL_NOT_FOUND: 'Hotel not found. Check HOTEL_ID in environment variables.',
  INVALID_HOTEL_CONFIG: 'Invalid hotel configuration',
  MISSING_REQUIRED_FIELDS: 'Missing required hotel configuration fields',
  PMS_NOT_SUPPORTED: 'PMS type not supported',
  INVALID_DOMAIN: 'Invalid domain format'
};

// Success messages
export const SUCCESS_MESSAGES = {
  HOTEL_LOADED: 'Hotel loaded successfully',
  CONFIG_VALIDATED: 'Hotel configuration validated',
  THEME_GENERATED: 'Theme generated successfully'
};

/**
 * Get environment-specific defaults
 */
export function getEnvironmentDefaults() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    protocol: isProduction ? DEFAULT_SERVICES.prodProtocol : DEFAULT_SERVICES.devProtocol,
    host: isDevelopment ? DEFAULT_SERVICES.devHost : null,
    port: isDevelopment ? DEFAULT_SERVICES.devPort : null,
    isProduction,
    isDevelopment
  };
}

/**
 * Get default fallback values for hotel configuration
 */
export function getHotelDefaults() {
  return {
    language: DEFAULT_LOCALIZATION.language,
    currency: DEFAULT_LOCALIZATION.currency,
    availableLanguages: [DEFAULT_LOCALIZATION.language],
    availableCurrencies: [DEFAULT_LOCALIZATION.currency],
    status: HOTEL_STATUS.PUBLISHED,
    pmsType: null,
    theme: THEME_DEFAULTS.defaultTheme
  };
}
