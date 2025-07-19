/**
 * Analytics utilities for tracking booking events
 * Supports Google Analytics 4 and Meta Pixel
 */

export interface BookingEventData {
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  rooms: number;
  roomType: string;
  totalAmount?: number;
  currency?: string;
  hotelName?: string;
  guestEmail?: string;
}

/**
 * Track booking initiated event for both GA4 and Meta Pixel
 * This should be called just before redirecting to external booking engine
 */
export function trackBookingInitiated(eventData: BookingEventData): void {
  const eventId = generateEventId();

  console.log('📊 [ANALYTICS] Tracking booking_initiated event:', {
    eventId,
    ...eventData,
  });

  // Track with Google Analytics 4
  trackGA4BookingInitiated(eventData, eventId);

  // Track with Meta Pixel
  trackMetaPixelBookingInitiated(eventData, eventId);
}

/**
 * Track booking initiated event with Google Analytics 4
 */
function trackGA4BookingInitiated(
  eventData: BookingEventData,
  eventId: string
): void {
  if (typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag('event', 'begin_checkout', {
        event_id: eventId,
        currency: eventData.currency || 'EUR',
        value: eventData.totalAmount || 0,
        items: [
          {
            item_id: eventData.roomType,
            item_name: eventData.roomType,
            category: 'accommodation',
            quantity: eventData.rooms,
            price: eventData.totalAmount || 0,
          },
        ],
        // Custom parameters
        check_in_date: eventData.checkIn,
        check_out_date: eventData.checkOut,
        adults: eventData.adults,
        children: eventData.children || 0,
        hotel_name: eventData.hotelName,
      });

      console.log('✅ [GA4] Booking initiated event tracked');
    } catch (error) {
      console.error('❌ [GA4] Error tracking booking initiated:', error);
    }
  } else {
    console.warn('⚠️ [GA4] gtag not available, skipping GA4 tracking');
  }
}

/**
 * Track booking initiated event with Meta Pixel
 */
function trackMetaPixelBookingInitiated(
  eventData: BookingEventData,
  eventId: string
): void {
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      window.fbq(
        'track',
        'InitiateCheckout',
        {
          content_type: 'product',
          content_ids: [eventData.roomType],
          content_name: eventData.roomType,
          content_category: 'accommodation',
          currency: eventData.currency || 'EUR',
          value: eventData.totalAmount || 0,
          num_items: eventData.rooms,
          // Custom parameters
          checkin_date: eventData.checkIn,
          checkout_date: eventData.checkOut,
          adults: eventData.adults,
          children: eventData.children || 0,
        },
        {
          event_id: eventId,
        }
      );

      console.log('✅ [META] Booking initiated event tracked');
    } catch (error) {
      console.error('❌ [META] Error tracking booking initiated:', error);
    }
  } else {
    console.warn('⚠️ [META] fbq not available, skipping Meta Pixel tracking');
  }
}

/**
 * Track successful booking completion (for API mode)
 */
export function trackBookingCompleted(
  eventData: BookingEventData & {
    bookingId: string;
    confirmationNumber: string;
  }
): void {
  const eventId = generateEventId();

  console.log('📊 [ANALYTICS] Tracking booking_completed event:', {
    eventId,
    ...eventData,
  });

  // Track with Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag('event', 'purchase', {
        event_id: eventId,
        transaction_id: eventData.bookingId,
        currency: eventData.currency || 'EUR',
        value: eventData.totalAmount || 0,
        items: [
          {
            item_id: eventData.roomType,
            item_name: eventData.roomType,
            category: 'accommodation',
            quantity: eventData.rooms,
            price: eventData.totalAmount || 0,
          },
        ],
      });

      console.log('✅ [GA4] Booking completed event tracked');
    } catch (error) {
      console.error('❌ [GA4] Error tracking booking completed:', error);
    }
  }

  // Track with Meta Pixel
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      window.fbq(
        'track',
        'Purchase',
        {
          content_type: 'product',
          content_ids: [eventData.roomType],
          currency: eventData.currency || 'EUR',
          value: eventData.totalAmount || 0,
          num_items: eventData.rooms,
        },
        {
          event_id: eventId,
        }
      );

      console.log('✅ [META] Booking completed event tracked');
    } catch (error) {
      console.error('❌ [META] Error tracking booking completed:', error);
    }
  }
}

/**
 * Generate unique event ID for deduplication
 */
function generateEventId(): string {
  return `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Type declarations for global analytics objects
 */
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}
