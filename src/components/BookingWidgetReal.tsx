/** @jsxImportSource @builder.io/qwik */
import {
  $,
  component$,
  useSignal,
  useStore,
  useTask$,
} from '@builder.io/qwik';

interface BookingWidgetRealProps {
  hotelName: string;
  defaultCurrency: string;
  className?: string;
  compact?: boolean;
}


export const BookingWidgetReal = component$<BookingWidgetRealProps>(
  ({
    hotelName,
    defaultCurrency: _defaultCurrency,
    className = '',
    compact = false,
  }) => {
    // Form state
    const checkIn = useSignal('');
    const checkOut = useSignal('');
    const adults = useSignal('2');
    const children = useSignal('0');
    const rooms = useSignal('1');

    // Simplified state for redirect mode
    const state = useStore({
      isLoading: false,
      error: '',
    });

    // Removed booking form state - not needed in redirect mode

    // Set default dates (Cloudbeds requires startDate > today)
    useTask$(() => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(today);
      dayAfter.setDate(dayAfter.getDate() + 2);

      checkIn.value = tomorrow.toISOString().split('T')[0];
      checkOut.value = dayAfter.toISOString().split('T')[0];
    });


    // Redirect to Cloudbeds booking page
    const searchAvailability = $(async () => {
      if (!checkIn.value || !checkOut.value) {
        state.error = 'Please select check-in and check-out dates';
        return;
      }

      state.isLoading = true;
      state.error = '';

      try {
        console.log('🔗 [FRONTEND] Generating Cloudbeds redirect URL...');

        // Call redirect URL generation API
        const redirectResponse = await fetch('/api/booking/redirect-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checkIn: checkIn.value,
            checkOut: checkOut.value,
            adults: parseInt(adults.value),
            children:
              parseInt(children.value) > 0
                ? parseInt(children.value)
                : undefined,
            rooms: parseInt(rooms.value),
          }),
        });

        const redirectData = await redirectResponse.json();

        console.log('🔗 [FRONTEND] Redirect response:', redirectData);

        if (!redirectData.success || !redirectData.redirectUrl) {
          throw new Error(
            redirectData.error || 'Failed to generate booking URL'
          );
        }

        console.log('🔗 [FRONTEND] Redirecting to:', redirectData.redirectUrl);

        // Redirect to Cloudbeds
        window.location.href = redirectData.redirectUrl;
      } catch (err) {
        state.error =
          err instanceof Error ? err.message : 'Failed to generate booking URL';
        console.error('🚨 [FRONTEND] Redirect error:', err);
      } finally {
        state.isLoading = false;
      }
    });


    return (
      <div class={`booking-widget-real ${className}`}>
        <div class="bg-base-100 border border-base-300 rounded-lg">
          <div class="p-6">
            <h3 class="mb-6 font-semibold text-primary text-xl">
              {compact ? 'Book Now' : `Book Your Stay at ${hotelName}`}
            </h3>

            {/* Search Form */}
            <div class="space-y-6">
                {/* Dates Section */}
                <div class="gap-4 grid grid-cols-1 sm:grid-cols-2">
                  <div class="form-control">
                    <label class="label" for="checkin-date">
                      <span class="font-medium text-base-content label-text">
                        Check-in Date
                      </span>
                    </label>
                    <input
                      id="checkin-date"
                      type="date"
                      class="input-bordered focus:border-primary focus:outline-none w-full transition-colors input"
                      bind:value={checkIn}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div class="form-control">
                    <label class="label" for="checkout-date">
                      <span class="font-medium text-base-content label-text">
                        Check-out Date
                      </span>
                    </label>
                    <input
                      id="checkout-date"
                      type="date"
                      class="input-bordered focus:border-primary focus:outline-none w-full transition-colors input"
                      bind:value={checkOut}
                      min={
                        checkIn.value || new Date().toISOString().split('T')[0]
                      }
                    />
                  </div>
                </div>

                {/* Guests and Rooms Section */}
                <div class="gap-4 grid grid-cols-1 sm:grid-cols-3">
                  <div class="form-control">
                    <label class="label" for="adults-select">
                      <span class="font-medium text-base-content label-text">
                        Adults
                      </span>
                    </label>
                    <select
                      id="adults-select"
                      class="focus:border-primary focus:outline-none w-full transition-colors select-bordered select"
                      bind:value={adults}
                    >
                      <option value={1}>1 Adult</option>
                      <option value={2}>2 Adults</option>
                      <option value={3}>3 Adults</option>
                      <option value={4}>4 Adults</option>
                      <option value={5}>5 Adults</option>
                      <option value={6}>6 Adults</option>
                    </select>
                  </div>

                  <div class="form-control">
                    <label class="label" for="children-select">
                      <span class="font-medium text-base-content label-text">
                        Children
                      </span>
                    </label>
                    <select
                      id="children-select"
                      class="focus:border-primary focus:outline-none w-full transition-colors select-bordered select"
                      bind:value={children}
                    >
                      <option value={0}>0 Children</option>
                      <option value={1}>1 Child</option>
                      <option value={2}>2 Children</option>
                      <option value={3}>3 Children</option>
                      <option value={4}>4 Children</option>
                    </select>
                  </div>

                  <div class="form-control">
                    <label class="label" for="rooms-select">
                      <span class="font-medium text-base-content label-text">
                        Rooms
                      </span>
                    </label>
                    <select
                      id="rooms-select"
                      class="focus:border-primary focus:outline-none w-full transition-colors select-bordered select"
                      bind:value={rooms}
                    >
                      <option value={1}>1 Room</option>
                      <option value={2}>2 Rooms</option>
                      <option value={3}>3 Rooms</option>
                      <option value={4}>4 Rooms</option>
                    </select>
                  </div>
                </div>

                {/* Search Button */}
                <div class="flex justify-center pt-2">
                  <button
                    type="button"
                    class={`btn btn-primary btn-lg px-8 ${state.isLoading ? 'loading' : ''} transition-all duration-200 hover:scale-105`}
                    onClick$={searchAvailability}
                    disabled={
                      state.isLoading || !checkIn.value || !checkOut.value
                    }
                  >
                    {state.isLoading ? (
                      <>
                        <span class="mr-2 loading loading-spinner loading-sm"></span>
                        Redirecting to Booking...
                      </>
                    ) : (
                      <>
                        <svg
                          class="mr-2 w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <title>Book icon</title>
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Book Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {state.error && (
              <div class="animate-pulse alert alert-error">
                <svg
                  class="stroke-current w-6 h-6 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <title>Error icon</title>
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h4 class="font-semibold">Booking Error</h4>
                  <span>{state.error}</span>
                </div>
                <button
                  type="button"
                  class="btn btn-sm btn-ghost"
                  onClick$={() => (state.error = '')}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Loading State */}
            {state.isLoading && (
              <div class="flex justify-center items-center py-8">
                <div class="text-center">
                  <span class="text-primary loading loading-spinner loading-lg"></span>
                  <p class="opacity-70 mt-4 text-base-content">
                    Redirecting to booking page...
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }
);
