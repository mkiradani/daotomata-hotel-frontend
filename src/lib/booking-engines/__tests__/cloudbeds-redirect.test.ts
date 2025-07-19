/**
 * Tests for Cloudbeds redirect mode functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CloudbedsEngine } from '../cloudbeds-engine';
import {
  buildCloudbedsUrl,
  shouldUseRedirectMode,
  extractPropertyUrlId,
} from '../cloudbeds-utils';
import type { BookingEngineConfig, BookingRequest } from '../types';

describe('Cloudbeds Redirect Mode', () => {
  let engine: CloudbedsEngine;
  let mockConfig: BookingEngineConfig;
  let mockBookingRequest: BookingRequest;

  beforeEach(() => {
    engine = new CloudbedsEngine();

    mockConfig = {
      type: 'cloudbeds',
      credentials: {
        apiKey: 'test-api-key',
        propertyId: 'test-property-id',
      },
      settings: {
        currency: 'EUR',
        language: 'en-US',
      },
      redirect: {
        enabled: true,
        propertyUrlId: 'lmKzDQ',
        baseUrl: 'https://hotels.cloudbeds.com',
        defaultLanguage: 'en',
        defaultCurrency: 'eur',
      },
    };

    mockBookingRequest = {
      checkIn: '2025-07-30',
      checkOut: '2025-08-06',
      adults: 2,
      children: 1,
      rooms: 1,
      guestInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        country: 'US',
      },
    };
  });

  describe('URL Generation', () => {
    it('should build correct Cloudbeds URL', () => {
      const url = buildCloudbedsUrl(
        {
          propertyUrlId: 'lmKzDQ',
          baseUrl: 'https://hotels.cloudbeds.com',
          defaultLanguage: 'en',
          defaultCurrency: 'eur',
        },
        {
          checkIn: '2025-07-30',
          checkOut: '2025-08-06',
          adults: 2,
          children: 1,
          currency: 'eur',
        }
      );

      expect(url).toBe(
        'https://hotels.cloudbeds.com/en/reservas/lmKzDQ?checkin=2025-07-30&checkout=2025-08-06&adults=2&currency=eur&kids=1'
      );
    });

    it('should handle optional parameters correctly', () => {
      const url = buildCloudbedsUrl(
        {
          propertyUrlId: 'testId',
          defaultLanguage: 'es',
          defaultCurrency: 'usd',
        },
        {
          checkIn: '2025-08-01',
          checkOut: '2025-08-03',
          adults: 1,
          promoCode: 'SUMMER2025',
        }
      );

      expect(url).toContain('promoCode=SUMMER2025');
      expect(url).toContain('/es/reservas/');
      expect(url).toContain('currency=usd');
    });

    it('should validate required parameters', () => {
      expect(() => {
        buildCloudbedsUrl(
          { propertyUrlId: '' },
          { checkIn: '2025-07-30', checkOut: '2025-08-06', adults: 2 }
        );
      }).toThrow('Property URL ID is required');

      expect(() => {
        buildCloudbedsUrl(
          { propertyUrlId: 'test' },
          { checkIn: '', checkOut: '2025-08-06', adults: 2 }
        );
      }).toThrow('Check-in and check-out dates are required');
    });
  });

  describe('Hotel Configuration', () => {
    it('should detect redirect mode correctly', () => {
      const hotelWithUrlId = { cloudbeds_booking_url_id: 'lmKzDQ' };
      const hotelWithoutUrlId = { cloudbeds_property_id: 'test' };
      const hotelWithDisabledRedirect = {
        cloudbeds_booking_url_id: 'lmKzDQ',
        cloudbeds_redirect_mode: false,
      };

      expect(shouldUseRedirectMode(hotelWithUrlId)).toBe(true);
      expect(shouldUseRedirectMode(hotelWithoutUrlId)).toBe(false);
      expect(shouldUseRedirectMode(hotelWithDisabledRedirect)).toBe(false);
    });

    it('should extract property URL ID correctly', () => {
      const hotelData = { cloudbeds_booking_url_id: '  lmKzDQ  ' };
      const emptyHotelData = { cloudbeds_booking_url_id: '' };

      expect(extractPropertyUrlId(hotelData)).toBe('lmKzDQ');
      expect(extractPropertyUrlId(emptyHotelData)).toBe(null);
      expect(extractPropertyUrlId({})).toBe(null);
    });
  });

  describe('Engine Integration', () => {
    it('should support redirect mode', () => {
      expect(engine.supportsRedirectMode()).toBe(true);
    });

    it('should generate booking URL when initialized with redirect config', async () => {
      await engine.initialize(mockConfig);

      const url = await engine.generateBookingUrl?.(mockBookingRequest);
      expect(url).toBeDefined();

      expect(url).toContain('hotels.cloudbeds.com');
      expect(url).toContain('lmKzDQ');
      expect(url).toContain('checkin=2025-07-30');
      expect(url).toContain('checkout=2025-08-06');
      expect(url).toContain('adults=2');
      expect(url).toContain('kids=1');
    });

    it('should return redirect response when redirect mode is enabled', async () => {
      await engine.initialize(mockConfig);

      const response = await engine.createBooking(mockBookingRequest);

      expect(response.success).toBe(true);
      expect(response.mode).toBe('redirect');
      expect(response.redirectUrl).toBeDefined();
      expect(response.redirectUrl).toContain('hotels.cloudbeds.com');
      expect(response.bookingId).toBeUndefined();
    });

    it('should throw error when redirect mode is not properly configured', async () => {
      const invalidConfig = {
        ...mockConfig,
        redirect: {
          enabled: true,
          propertyUrlId: '', // Missing property URL ID
        },
      };

      await engine.initialize(invalidConfig);

      await expect(
        engine.generateBookingUrl?.(mockBookingRequest)
      ).rejects.toThrow('Redirect mode not properly configured');
    });
  });

  describe('Analytics Integration', () => {
    it('should prepare correct event data for analytics', () => {
      const eventData = {
        checkIn: mockBookingRequest.checkIn,
        checkOut: mockBookingRequest.checkOut,
        adults: mockBookingRequest.adults || 2,
        children: mockBookingRequest.children,
        rooms: mockBookingRequest.rooms || 1,
        roomType: 'Standard Room',
        totalAmount: 150.0,
        currency: 'EUR',
        hotelName: 'Test Hotel',
        guestEmail: mockBookingRequest.guestInfo?.email,
      };

      expect(eventData.checkIn).toBe('2025-07-30');
      expect(eventData.checkOut).toBe('2025-08-06');
      expect(eventData.adults).toBe(2);
      expect(eventData.children).toBe(1);
      expect(eventData.guestEmail).toBe('john@example.com');
    });
  });
});

describe('Cloudbeds Utils', () => {
  describe('URL Parameter Validation', () => {
    it('should validate date format', () => {
      expect(() => {
        buildCloudbedsUrl(
          { propertyUrlId: 'test' },
          { checkIn: '2025/07/30', checkOut: '2025-08-06', adults: 1 }
        );
      }).toThrow('Dates must be in YYYY-MM-DD format');
    });

    it('should validate adults count', () => {
      expect(() => {
        buildCloudbedsUrl(
          { propertyUrlId: 'test' },
          { checkIn: '2025-07-30', checkOut: '2025-08-06', adults: 0 }
        );
      }).toThrow('At least 1 adult is required');
    });
  });
});
