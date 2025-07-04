# Booking Engines - Adaptable Multi-Engine Architecture

This module provides a unified interface for multiple booking engines, starting with Cloudbeds integration and designed to easily support additional engines like Booking.com, Expedia, Airbnb, and custom solutions.

## Architecture Overview

The system follows a **Strategy Pattern** with a **Factory Pattern** to provide a clean, adaptable architecture:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  BookingService │────│ BookingEngine    │────│ CloudbedsEngine │
│  (High-level)   │    │ Factory          │    │ (Implementation)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ├─────────────────┐
                                │ Future Engines  │
                                │ - Booking.com   │
                                │ - Expedia       │
                                │ - Airbnb        │
                                │ - Custom        │
                                └─────────────────┘
```

## Key Components

### 1. Types & Interfaces (`types.ts`)
- **`IBookingEngine`**: Common interface all engines must implement
- **`BookingEngineConfig`**: Configuration structure for any engine
- **`RoomAvailability`**, **`RoomRate`**, **`BookingRequest`**: Unified data models
- **Error Classes**: Specific error types for different scenarios

### 2. Engine Implementations
- **`CloudbedsEngine`**: Full Cloudbeds API integration
- **Future engines**: Booking.com, Expedia, etc. (following same interface)

### 3. Factory (`factory.ts`)
- **`BookingEngineFactory`**: Creates appropriate engine instances
- **Auto-detection**: Determines engine type from hotel configuration
- **Validation**: Ensures proper configuration before initialization

### 4. Service Layer (`booking-service.ts`)
- **`BookingService`**: High-level API for booking operations
- **Caching**: Manages engine instances per hotel
- **Validation**: Request validation and error handling
- **Utilities**: Price formatting, date calculations, etc.

## Usage Examples

### Basic Usage

```typescript
import { getBookingService } from './lib/booking-engines';

// Initialize for a hotel
const bookingService = getBookingService();
await bookingService.initializeForHotel(hotelData);

// Check availability
const availability = await bookingService.checkAvailability(hotelId, {
  checkIn: '2024-07-01',
  checkOut: '2024-07-03',
  adults: 2,
  children: 1,
  rooms: 1
});

// Create booking
const booking = await bookingService.createBooking(hotelId, {
  checkIn: '2024-07-01',
  checkOut: '2024-07-03',
  adults: 2,
  guestInfo: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com'
  }
});
```

### Convenience Functions

```typescript
import { BookingEngines } from './lib/booking-engines';

// Quick operations
const availability = await BookingEngines.checkAvailability(hotelId, query);
const rates = await BookingEngines.getRates(hotelId, query);
const booking = await BookingEngines.createBooking(hotelId, request);

// Utilities
const hasBooking = BookingEngines.hasBookingCapabilities(hotelData);
const formatted = BookingEngines.formatPrice(120.50, 'EUR');
const validation = BookingEngines.validateBookingRequest(request);
```

## Configuration

### Hotel Configuration in Directus

Each hotel in Directus should have:

```typescript
{
  pms_type: 'cloudbeds', // Engine type
  cloudbeds_client_id: 'live1_317353_...',
  cloudbeds_client_secret: 'JNhlmuEo2Lin...',
  cloudbeds_api_key: 'cbat_mUMzpzKs...',
  cloudbeds_property_id: '317353',
  default_currency: 'EUR',
  default_language: 'en-US'
}
```

### Supported Engines

Currently implemented:
- ✅ **Cloudbeds**: Full API integration with OAuth and API key support

Planned:
- 🔄 **Booking.com**: Partner API integration
- 🔄 **Expedia**: Partner API integration  
- 🔄 **Airbnb**: Host API integration
- 🔄 **Custom**: Generic webhook/API interface

## API Endpoints

The system includes REST API endpoints for frontend integration:

- **POST** `/api/booking/availability` - Check room availability
- **POST** `/api/booking/rates` - Get room rates
- **POST** `/api/booking/create` - Create new booking

### Example API Usage

```javascript
// Check availability
const response = await fetch('/api/booking/availability', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hotelDomain: 'baberrih.daotomata.io',
    checkIn: '2024-07-01',
    checkOut: '2024-07-03',
    adults: 2,
    children: 1
  })
});

const { availability } = await response.json();
```

## Frontend Components

### BookingWidget (Qwik Component)

A complete booking widget that can be embedded anywhere:

```tsx
<BookingWidget 
  hotelId={hotel.id}
  hotelName={hotel.name}
  defaultCurrency={hotel.default_currency}
  compact={false}
/>
```

### Enhanced Room/Activity Cards

Room and activity cards now include "Book Now" buttons that open booking modals.

## Error Handling

The system includes comprehensive error handling:

```typescript
try {
  const booking = await bookingService.createBooking(hotelId, request);
} catch (error) {
  if (error instanceof ConfigurationError) {
    // Handle configuration issues
  } else if (error instanceof AvailabilityError) {
    // Handle availability issues
  } else if (error instanceof BookingError) {
    // Handle booking creation issues
  }
}
```

## Adding New Engines

To add a new booking engine:

1. **Create Engine Class**:
```typescript
export class NewEngine implements IBookingEngine {
  async initialize(config: BookingEngineConfig): Promise<void> {
    // Implementation
  }
  
  async checkAvailability(query: RateQuery): Promise<RoomAvailability[]> {
    // Implementation
  }
  
  // ... other required methods
}
```

2. **Update Factory**:
```typescript
// In factory.ts
case 'new-engine':
  return new NewEngine();
```

3. **Update Types**:
```typescript
// In types.ts
export interface BookingEngineConfig {
  type: 'cloudbeds' | 'booking.com' | 'new-engine';
  // ...
}
```

## Testing

The system is designed for easy testing with mock implementations:

```typescript
// Mock engine for testing
class MockEngine implements IBookingEngine {
  async checkAvailability(): Promise<RoomAvailability[]> {
    return mockAvailabilityData;
  }
  // ... other methods
}
```

## Security Considerations

- **API Keys**: Stored securely in Directus, never exposed to frontend
- **Validation**: All requests validated before processing
- **Rate Limiting**: Consider implementing rate limiting for API endpoints
- **HTTPS**: All external API calls use HTTPS
- **Error Sanitization**: Error messages sanitized before sending to frontend

## Performance Optimizations

- **Caching**: Engine instances cached per hotel
- **Parallel Requests**: Availability and rates fetched in parallel when possible
- **Connection Pooling**: Reuse HTTP connections for external APIs
- **Lazy Loading**: Engines initialized only when needed

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live availability
2. **Advanced Caching**: Redis-based caching for frequently accessed data
3. **Analytics**: Booking conversion tracking and analytics
4. **Multi-language**: Localized booking flows
5. **Payment Integration**: Stripe/PayPal integration for direct payments
6. **Inventory Management**: Real-time inventory synchronization
