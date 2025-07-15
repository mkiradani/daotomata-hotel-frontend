/** @jsxImportSource @builder.io/qwik */
import { component$, useSignal, useTask$ } from '@builder.io/qwik';

interface HotelDetails {
  id: string;
  name: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
  };
  contact: {
    phone: string;
    email: string;
    website: string;
  };
  settings: {
    currency: string;
    timezone: string;
    language: string;
    check_in_time: string;
    check_out_time: string;
  };
  amenities: string[];
  policies: {
    cancellation_policy: string;
    pet_policy: string;
    smoking_policy: string;
  };
  images: Array<{
    url: string;
    caption?: string;
    type?: string;
  }>;
}

interface HotelInfoProps {
  hotelName: string;
  hotelDescription?: string;
  heroImageUrl?: string;
  logoUrl?: string;
}

export const HotelInfo = component$<HotelInfoProps>(
  ({ hotelName, hotelDescription, heroImageUrl, logoUrl }) => {
    const hotelDetails = useSignal<HotelDetails | null>(null);
    const isLoading = useSignal(true);
    const error = useSignal<string>('');

    // Load hotel details from API
    useTask$(async () => {
      try {
        const response = await fetch('/api/booking/hotel-details');
        const data = await response.json();
        
        if (data.success && data.data) {
          hotelDetails.value = data.data;
        } else {
          throw new Error(data.error || 'Failed to load hotel details');
        }
      } catch (err) {
        console.error('Failed to load hotel details:', err);
        error.value = err instanceof Error ? err.message : 'Failed to load hotel details';
      } finally {
        isLoading.value = false;
      }
    });

    if (isLoading.value) {
      return (
        <div class="text-center py-12">
          <div class="loading loading-spinner loading-lg"></div>
          <p class="mt-4 text-sm opacity-70">Loading hotel information...</p>
        </div>
      );
    }

    if (error.value) {
      return (
        <div class="text-center py-12">
          <div class="alert alert-warning max-w-md mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>Unable to load hotel details</span>
          </div>
        </div>
      );
    }

    const details = hotelDetails.value;
    if (!details) return null;

    return (
      <div class="max-w-6xl mx-auto">
        {/* Hotel Overview */}
        <div class="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 class="text-3xl font-primary text-primary mb-6">
              Welcome to {details.name}
            </h2>
            <p class="text-lg text-base-content/80 leading-relaxed mb-6">
              {details.description}
            </p>
            {hotelDescription && (
              <p class="text-base text-base-content/70 leading-relaxed">
                {hotelDescription}
              </p>
            )}
          </div>
          <div class="text-center">
            {heroImageUrl && (
              <img
                src={heroImageUrl}
                alt={hotelName}
                class="w-full h-64 object-cover rounded-lg shadow-lg"
              />
            )}
          </div>
        </div>

        {/* Hotel Details Grid */}
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Contact Information */}
          <div class="bg-base-100 p-6 rounded-lg border border-base-300">
            <h3 class="text-xl font-medium text-primary mb-4">Contact Information</h3>
            <div class="space-y-3">
              {details.contact.phone && (
                <div class="flex items-center">
                  <svg class="w-5 h-5 mr-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <span class="text-sm">{details.contact.phone}</span>
                </div>
              )}
              {details.contact.email && (
                <div class="flex items-center">
                  <svg class="w-5 h-5 mr-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span class="text-sm">{details.contact.email}</span>
                </div>
              )}
              {details.contact.website && (
                <div class="flex items-center">
                  <svg class="w-5 h-5 mr-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clip-rule="evenodd" />
                  </svg>
                  <span class="text-sm">{details.contact.website}</span>
                </div>
              )}
            </div>
          </div>

          {/* Check-in/Check-out */}
          <div class="bg-base-100 p-6 rounded-lg border border-base-300">
            <h3 class="text-xl font-medium text-primary mb-4">Check-in & Check-out</h3>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-sm font-medium">Check-in:</span>
                <span class="text-sm">{details.settings.check_in_time}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm font-medium">Check-out:</span>
                <span class="text-sm">{details.settings.check_out_time}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm font-medium">Currency:</span>
                <span class="text-sm">{details.settings.currency}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm font-medium">Timezone:</span>
                <span class="text-sm">{details.settings.timezone}</span>
              </div>
            </div>
          </div>

          {/* Amenities Preview */}
          <div class="bg-base-100 p-6 rounded-lg border border-base-300">
            <h3 class="text-xl font-medium text-primary mb-4">Key Amenities</h3>
            <div class="space-y-2">
              {details.amenities.slice(0, 6).map((amenity, index) => (
                <div key={index} class="flex items-center">
                  <svg class="w-4 h-4 mr-2 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                  <span class="text-sm">{amenity}</span>
                </div>
              ))}
              {details.amenities.length > 6 && (
                <p class="text-xs text-base-content/60 mt-2">
                  +{details.amenities.length - 6} more amenities
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
