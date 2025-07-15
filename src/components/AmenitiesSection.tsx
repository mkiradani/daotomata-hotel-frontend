/** @jsxImportSource @builder.io/qwik */
import { component$, useSignal, useTask$ } from '@builder.io/qwik';

interface HotelDetails {
  amenities: string[];
  settings: {
    currency: string;
    timezone: string;
    check_in_time: string;
    check_out_time: string;
  };
}

interface AmenitiesSectionProps {
  hotelName: string;
}

export const AmenitiesSection = component$<AmenitiesSectionProps>(
  ({ hotelName }) => {
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
          <p class="mt-4 text-sm opacity-70">Loading amenities...</p>
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
            <span>Unable to load amenities</span>
          </div>
        </div>
      );
    }

    const details = hotelDetails.value;
    if (!details || !details.amenities) return null;

    // Group amenities by category for better organization
    const categorizeAmenities = (amenities: string[]) => {
      const categories: Record<string, string[]> = {
        'Connectivity': [],
        'Recreation': [],
        'Dining': [],
        'Services': [],
        'Comfort': [],
        'Other': []
      };

      amenities.forEach(amenity => {
        const lower = amenity.toLowerCase();
        if (lower.includes('wifi') || lower.includes('internet')) {
          categories['Connectivity'].push(amenity);
        } else if (lower.includes('pool') || lower.includes('fitness') || lower.includes('gym') || lower.includes('spa')) {
          categories['Recreation'].push(amenity);
        } else if (lower.includes('restaurant') || lower.includes('bar') || lower.includes('breakfast') || lower.includes('room service')) {
          categories['Dining'].push(amenity);
        } else if (lower.includes('concierge') || lower.includes('service') || lower.includes('parking') || lower.includes('housekeeping')) {
          categories['Services'].push(amenity);
        } else if (lower.includes('air conditioning') || lower.includes('heating') || lower.includes('climate')) {
          categories['Comfort'].push(amenity);
        } else {
          categories['Other'].push(amenity);
        }
      });

      // Remove empty categories
      return Object.entries(categories).filter(([_, items]) => items.length > 0);
    };

    const categorizedAmenities = categorizeAmenities(details.amenities);

    const getIconForCategory = (category: string) => {
      switch (category) {
        case 'Connectivity':
          return (
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2v8h10V6H5z" clip-rule="evenodd" />
            </svg>
          );
        case 'Recreation':
          return (
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
        case 'Dining':
          return (
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1z" clip-rule="evenodd" />
            </svg>
          );
        case 'Services':
          return (
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd" />
            </svg>
          );
        case 'Comfort':
          return (
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0v-.5A1.5 1.5 0 0114.5 6c.526 0 .988-.27 1.256-.679a6.012 6.012 0 011.912 2.706A8.054 8.054 0 0117 10a8.054 8.054 0 01-.332 2.027z" clip-rule="evenodd" />
            </svg>
          );
        default:
          return (
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          );
      }
    };

    return (
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-primary text-primary mb-4">
            Amenities & Services at {hotelName}
          </h2>
          <p class="text-lg text-base-content/80">
            Everything you need for a comfortable and memorable stay
          </p>
        </div>

        {/* Categorized Amenities */}
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {categorizedAmenities.map(([category, amenities]) => (
            <div key={category} class="bg-base-100 p-6 rounded-lg border border-base-300">
              <div class="flex items-center mb-4">
                <div class="text-primary mr-3">
                  {getIconForCategory(category)}
                </div>
                <h3 class="text-xl font-medium text-primary">{category}</h3>
              </div>
              <ul class="space-y-2">
                {amenities.map((amenity, index) => (
                  <li key={index} class="flex items-center">
                    <svg class="w-4 h-4 mr-2 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    <span class="text-sm">{amenity}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Hotel Information */}
        <div class="bg-base-100 p-8 rounded-lg border border-base-300">
          <h3 class="text-2xl font-medium text-primary mb-6 text-center">
            Hotel Information
          </h3>
          <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="text-center">
              <div class="text-primary mb-2">
                <svg class="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                </svg>
              </div>
              <h4 class="font-medium mb-1">Check-in</h4>
              <p class="text-sm text-base-content/70">{details.settings.check_in_time}</p>
            </div>
            <div class="text-center">
              <div class="text-primary mb-2">
                <svg class="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                </svg>
              </div>
              <h4 class="font-medium mb-1">Check-out</h4>
              <p class="text-sm text-base-content/70">{details.settings.check_out_time}</p>
            </div>
            <div class="text-center">
              <div class="text-primary mb-2">
                <svg class="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd" />
                </svg>
              </div>
              <h4 class="font-medium mb-1">Currency</h4>
              <p class="text-sm text-base-content/70">{details.settings.currency}</p>
            </div>
            <div class="text-center">
              <div class="text-primary mb-2">
                <svg class="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clip-rule="evenodd" />
                </svg>
              </div>
              <h4 class="font-medium mb-1">Timezone</h4>
              <p class="text-sm text-base-content/70">{details.settings.timezone}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
