/** @jsxImportSource @builder.io/qwik */
import { component$, useSignal, useTask$ } from '@builder.io/qwik';

interface HotelDetails {
  policies: {
    cancellation_policy: string;
    pet_policy: string;
    smoking_policy: string;
  };
  settings: {
    check_in_time: string;
    check_out_time: string;
    currency: string;
  };
}

interface PoliciesSectionProps {
  hotelName: string;
}

export const PoliciesSection = component$<PoliciesSectionProps>(
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
          <p class="mt-4 text-sm opacity-70">Loading policies...</p>
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
            <span>Unable to load policies</span>
          </div>
        </div>
      );
    }

    const details = hotelDetails.value;
    if (!details) return null;

    const policies = [
      {
        title: 'Cancellation Policy',
        icon: (
          <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
          </svg>
        ),
        content: details.policies.cancellation_policy,
        color: 'text-blue-600'
      },
      {
        title: 'Pet Policy',
        icon: (
          <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a2 2 0 002 2h2a2 2 0 002-2v-4a1 1 0 00-.553-.894l-2-1A1 1 0 0016 6h-2a1 1 0 00-.447.106l-2 1z" />
          </svg>
        ),
        content: details.policies.pet_policy,
        color: 'text-green-600'
      },
      {
        title: 'Smoking Policy',
        icon: (
          <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clip-rule="evenodd" />
          </svg>
        ),
        content: details.policies.smoking_policy,
        color: 'text-red-600'
      }
    ];

    const additionalPolicies = [
      {
        title: 'Check-in & Check-out',
        items: [
          `Check-in time: ${details.settings.check_in_time}`,
          `Check-out time: ${details.settings.check_out_time}`,
          'Early check-in and late check-out may be available upon request and subject to availability',
          'Valid photo identification is required at check-in'
        ]
      },
      {
        title: 'Payment & Pricing',
        items: [
          `All prices are quoted in ${details.settings.currency}`,
          'Payment is required at the time of booking or check-in',
          'We accept major credit cards and cash',
          'Additional charges may apply for extra services and amenities'
        ]
      },
      {
        title: 'General Policies',
        items: [
          'Guests are responsible for any damage to hotel property',
          'Quiet hours are observed from 10:00 PM to 7:00 AM',
          'Outside food and beverages may be restricted in certain areas',
          'Hotel management reserves the right to refuse service'
        ]
      }
    ];

    return (
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-primary text-primary mb-4">
            Hotel Policies at {hotelName}
          </h2>
          <p class="text-lg text-base-content/80">
            Please review our policies to ensure a smooth and enjoyable stay
          </p>
        </div>

        {/* Main Policies */}
        <div class="grid md:grid-cols-3 gap-8 mb-12">
          {policies.map((policy, index) => (
            <div key={index} class="bg-base-100 p-6 rounded-lg border border-base-300">
              <div class="flex items-center mb-4">
                <div class={`${policy.color} mr-3`}>
                  {policy.icon}
                </div>
                <h3 class="text-xl font-medium text-primary">{policy.title}</h3>
              </div>
              <p class="text-sm text-base-content/80 leading-relaxed">
                {policy.content}
              </p>
            </div>
          ))}
        </div>

        {/* Additional Policies */}
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {additionalPolicies.map((section, index) => (
            <div key={index} class="bg-base-100 p-6 rounded-lg border border-base-300">
              <h3 class="text-xl font-medium text-primary mb-4">{section.title}</h3>
              <ul class="space-y-3">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex} class="flex items-start">
                    <svg class="w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    <span class="text-sm text-base-content/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Important Notice */}
        <div class="mt-12 bg-base-200 p-6 rounded-lg border-l-4 border-primary">
          <div class="flex items-start">
            <svg class="w-6 h-6 text-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
            <div>
              <h4 class="font-medium text-primary mb-2">Important Notice</h4>
              <p class="text-sm text-base-content/80 leading-relaxed">
                These policies are subject to change without notice. For the most current information or if you have any questions about our policies, please contact our front desk or customer service team. We appreciate your understanding and cooperation in helping us maintain a pleasant environment for all guests.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
