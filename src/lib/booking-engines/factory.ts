/**
 * Booking engine factory
 */

import { CloudbedsEngine } from './cloudbeds-engine';
import type {
  BookingEngineConfig,
  IBookingEngine,
  IBookingEngineFactory,
} from './types';
import { ConfigurationError } from './types';

/**
 * Factory class to create booking engine instances
 */
export class BookingEngineFactory implements IBookingEngineFactory {
  private static instance: BookingEngineFactory;

  private constructor() {}

  static getInstance(): BookingEngineFactory {
    if (!BookingEngineFactory.instance) {
      BookingEngineFactory.instance = new BookingEngineFactory();
    }
    return BookingEngineFactory.instance;
  }

  createEngine(type: BookingEngineConfig['type']): IBookingEngine {
    switch (type) {
      case 'cloudbeds':
        return new CloudbedsEngine();

      case 'booking.com':
        // TODO: Implement Booking.com engine
        throw new ConfigurationError(
          `Booking engine '${type}' is not implemented yet`
        );

      case 'expedia':
        // TODO: Implement Expedia engine
        throw new ConfigurationError(
          `Booking engine '${type}' is not implemented yet`
        );

      case 'airbnb':
        // TODO: Implement Airbnb engine
        throw new ConfigurationError(
          `Booking engine '${type}' is not implemented yet`
        );

      case 'custom':
        // TODO: Implement custom engine interface
        throw new ConfigurationError(
          `Booking engine '${type}' is not implemented yet`
        );

      default:
        throw new ConfigurationError(`Unknown booking engine type: ${type}`);
    }
  }

  getSupportedEngines(): BookingEngineConfig['type'][] {
    return ['cloudbeds']; // Add more as they are implemented
  }

  /**
   * Create and initialize a booking engine from hotel configuration
   */
  async createFromHotelConfig(
    hotelData: Record<string, unknown>
  ): Promise<IBookingEngine> {
    const config = this.extractBookingConfig(hotelData);
    const engine = this.createEngine(config.type);
    await engine.initialize(config);
    return engine;
  }

  /**
   * Extract booking engine configuration from hotel data
   */
  private extractBookingConfig(
    hotelData: Record<string, unknown>
  ): BookingEngineConfig {
    const pmsType = hotelData.pms_type;

    if (!pmsType) {
      throw new ConfigurationError('Hotel does not have a PMS type configured');
    }

    switch (pmsType) {
      case 'cloudbeds':
        return {
          type: 'cloudbeds',
          credentials: {
            clientId: String(hotelData.cloudbeds_client_id || ''),
            clientSecret: String(hotelData.cloudbeds_client_secret || ''),
            apiKey: String(hotelData.cloudbeds_api_key || ''),
            propertyId: String(hotelData.cloudbeds_property_id || ''),
          },
          settings: {
            currency: String(hotelData.default_currency || 'USD'),
            language: String(hotelData.default_language || 'en-US'),
          },
        };

      default:
        throw new ConfigurationError(`Unsupported PMS type: ${pmsType}`);
    }
  }

  /**
   * Validate if a hotel has proper booking engine configuration
   */
  validateHotelConfig(hotelData: Record<string, unknown>): boolean {
    try {
      const config = this.extractBookingConfig(hotelData);
      const engine = this.createEngine(config.type);
      return engine.validateConfig(config);
    } catch {
      return false;
    }
  }

  /**
   * Get available booking engines for a hotel based on its configuration
   */
  getAvailableEnginesForHotel(
    hotelData: Record<string, unknown>
  ): BookingEngineConfig['type'][] {
    const availableEngines: BookingEngineConfig['type'][] = [];

    // Check Cloudbeds
    if (
      hotelData.pms_type === 'cloudbeds' &&
      (hotelData.cloudbeds_api_key ||
        (hotelData.cloudbeds_client_id && hotelData.cloudbeds_client_secret)) &&
      hotelData.cloudbeds_property_id
    ) {
      availableEngines.push('cloudbeds');
    }

    // TODO: Add checks for other engines as they are implemented

    return availableEngines;
  }
}

/**
 * Convenience function to get the factory instance
 */
export const getBookingEngineFactory = () => BookingEngineFactory.getInstance();

/**
 * Convenience function to create a booking engine for a hotel
 */
export const createBookingEngineForHotel = async (
  hotelData: Record<string, unknown>
): Promise<IBookingEngine> => {
  const factory = getBookingEngineFactory();
  return await factory.createFromHotelConfig(hotelData);
};

/**
 * Convenience function to check if a hotel has booking capabilities
 */
export const hasBookingCapabilities = (
  hotelData: Record<string, unknown>
): boolean => {
  const factory = getBookingEngineFactory();
  return factory.validateHotelConfig(hotelData);
};
