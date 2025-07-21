/** @jsxImportSource @builder.io/qwik */
import { $, component$, useSignal, useStore, useTask$ } from '@builder.io/qwik';

interface HeroBookingWidgetProps {
  hotelName: string;
  className?: string;
}

export const HeroBookingWidget = component$<HeroBookingWidgetProps>(
  ({ hotelName, className = '' }) => {
    // Form state
    const checkIn = useSignal('');
    const checkOut = useSignal('');
    const adults = useSignal('2');
    const children = useSignal('0');
    const rooms = useSignal('1');

    // Component state
    const state = useStore({
      isLoading: false,
      error: '',
    });

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

    // Search availability and redirect to Cloudbeds
    const searchAvailability = $(async () => {
      if (!checkIn.value || !checkOut.value) {
        state.error = 'Please select check-in and check-out dates';
        return;
      }

      state.isLoading = true;
      state.error = '';

      try {
        console.log('🔗 [HERO-WIDGET] Generating Cloudbeds redirect URL...');

        // Call redirect URL generation API
        const redirectResponse = await fetch('/api/booking/redirect-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDate: checkIn.value,
            endDate: checkOut.value,
            adults: parseInt(adults.value),
            children: parseInt(children.value),
            rooms: parseInt(rooms.value),
          }),
        });

        const redirectData = await redirectResponse.json();

        if (!redirectData.success) {
          throw new Error(redirectData.error || 'Failed to generate booking URL');
        }

        console.log('✅ [HERO-WIDGET] Redirect URL generated:', redirectData.data.url);

        // Redirect to Cloudbeds
        window.location.href = redirectData.data.url;
      } catch (error) {
        console.error('❌ [HERO-WIDGET] Search failed:', error);
        state.error = error instanceof Error ? error.message : 'Search failed. Please try again.';
      } finally {
        state.isLoading = false;
      }
    });

    return (
      <div class={`w-full max-w-4xl mx-auto ${className}`}>
        <div
          class="backdrop-blur-md p-6 border"
          style="background: linear-gradient(to bottom, color-mix(in srgb, var(--color-base-100) 15%, transparent) 0%, color-mix(in srgb, var(--color-base-100) 25%, transparent) 100%); border: 1px solid color-mix(in srgb, var(--color-base-100) 30%, transparent); border-radius: var(--radius-box, 0rem); box-shadow: 0 4px 16px color-mix(in srgb, var(--color-base-100) 15%, transparent);"
        >

          {/* Booking Form */}
          <div class="space-y-4">
            {/* Form Grid - 2x2 Layout */}
            <div class="gap-4 grid grid-cols-2">
              {/* Check-in Date */}
              <div class="form-control">
                <label class="label" for="hero-checkin-date">
                  <span class="font-secondary font-medium text-white/90 text-sm label-text">
                    Check-in
                  </span>
                </label>
                <input
                  id="hero-checkin-date"
                  type="date"
                  class="bg-transparent input-bordered focus:border-primary focus:outline-none w-full text-white transition-colors input placeholder-white/70"
                  style="border-radius: var(--radius-field, 0rem); border-color: color-mix(in srgb, var(--color-base-100) 40%, transparent);"
                  bind:value={checkIn}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Check-out Date */}
              <div class="form-control">
                <label class="label" for="hero-checkout-date">
                  <span class="font-secondary font-medium text-white/90 text-sm label-text">
                    Check-out
                  </span>
                </label>
                <input
                  id="hero-checkout-date"
                  type="date"
                  class="bg-transparent input-bordered focus:border-primary focus:outline-none w-full text-white transition-colors input placeholder-white/70"
                  style="border-radius: var(--radius-field, 0rem); border-color: color-mix(in srgb, var(--color-base-100) 40%, transparent);"
                  bind:value={checkOut}
                  min={checkIn.value || new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Adults Selection */}
              <div class="form-control">
                <label class="label" for="hero-adults">
                  <span class="font-secondary font-medium text-white/90 text-sm label-text">
                    Adults
                  </span>
                </label>
                <select
                  id="hero-adults"
                  class="bg-transparent focus:border-primary focus:outline-none w-full text-white transition-colors select-bordered select"
                  style="border-radius: var(--radius-selector, 0rem); border-color: color-mix(in srgb, var(--color-base-100) 40%, transparent);"
                  bind:value={adults}
                >
                  <option value="1">1 Adult</option>
                  <option value="2">2 Adults</option>
                  <option value="3">3 Adults</option>
                  <option value="4">4 Adults</option>
                  <option value="5">5 Adults</option>
                  <option value="6">6 Adults</option>
                </select>
              </div>

              {/* Children Selection */}
              <div class="form-control">
                <label class="label" for="hero-children">
                  <span class="font-secondary font-medium text-white/90 text-sm label-text">
                    Kids
                  </span>
                </label>
                <select
                  id="hero-children"
                  class="bg-transparent focus:border-primary focus:outline-none w-full text-white transition-colors select-bordered select"
                  style="border-radius: var(--radius-selector, 0rem); border-color: color-mix(in srgb, var(--color-base-100) 40%, transparent);"
                  bind:value={children}
                >
                  <option value="0">0 Kids</option>
                  <option value="1">1 Kid</option>
                  <option value="2">2 Kids</option>
                  <option value="3">3 Kids</option>
                  <option value="4">4 Kids</option>
                </select>
              </div>

              {/* Search Button - Spans 2 columns */}
              <div class="col-span-2 form-control">
                <button
                  type="button"
                  class={`btn btn-md w-full font-normal ${state.isLoading ? 'loading' : ''} transition-all duration-200 hover:scale-105`}
                  style="background: var(--color-primary); color: var(--color-primary-content); border: 1px solid var(--color-primary); border-radius: var(--radius-box, 0rem); box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary) 30%, transparent);"
                  onClick$={searchAvailability}
                  disabled={
                    state.isLoading || !checkIn.value || !checkOut.value
                  }
                >
                  {state.isLoading ? (
                    <>
                      <span class="loading loading-spinner loading-sm"></span>
                      Searching...
                    </>
                  ) : (
                    <>
                      <svg
                        class="mr-2 w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <title>Search icon</title>
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      Search Rooms
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {state.error && (
              <div class="alert alert-error">
                <div class="flex items-center">
                  <svg
                    class="mr-2 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <title>Error icon</title>
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span class="text-sm">{state.error}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);