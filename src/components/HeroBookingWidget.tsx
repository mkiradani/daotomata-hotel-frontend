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

        console.log('🔗 [HERO-WIDGET] Redirect response:', redirectData);

        if (!redirectData.success || !redirectData.redirectUrl) {
          throw new Error(
            redirectData.error || 'Failed to generate booking URL'
          );
        }

        console.log(
          '🔗 [HERO-WIDGET] Redirecting to:',
          redirectData.redirectUrl
        );

        // Redirect to Cloudbeds
        window.location.href = redirectData.redirectUrl;
      } catch (err) {
        state.error =
          err instanceof Error ? err.message : 'Failed to generate booking URL';
        console.error('🚨 [HERO-WIDGET] Redirect error:', err);
      } finally {
        state.isLoading = false;
      }
    });

    return (
      <div class={`hero-booking-widget ${className}`}>
        {/* Glass-morphism card with gradient background and subtle border */}
        <div
          class="backdrop-blur-lg shadow-2xl p-6 border"
          style="background: linear-gradient(135deg, color-mix(in srgb, var(--color-base-100) 20%, transparent) 0%, color-mix(in srgb, var(--color-base-100) 10%, transparent) 100%); border: 1px solid color-mix(in srgb, var(--color-base-100) 30%, transparent); border-radius: var(--radius-box, 0rem); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);"
        >
          {/* Header */}
          <div class="mb-6 text-center">
            <h3
              class="mb-2 font-primary text-xl"
              style="color: var(--color-base-100);"
            >
              Book Your Stay
            </h3>
            <p
              class="font-secondary text-sm"
              style="color: color-mix(in srgb, var(--color-base-100) 80%, transparent);"
            >
              Select your dates and preferences for {hotelName}
            </p>
          </div>

          {/* Booking Form */}
          <div class="space-y-4">
            {/* Form Grid - Responsive Layout */}
            <div class="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {/* Check-in Date */}
              <div class="form-control">
                <label class="label" for="hero-checkin-date">
                  <span
                    class="font-secondary text-sm label-text"
                    style="color: color-mix(in srgb, var(--color-base-100) 90%, transparent);"
                  >
                    Check-in
                  </span>
                </label>
                <input
                  id="hero-checkin-date"
                  type="date"
                  class="input-bordered focus:border-primary focus:outline-none w-full transition-all duration-200 input h-12"
                  style="background: transparent; border: 1px solid color-mix(in srgb, var(--color-base-100) 40%, transparent); border-radius: var(--radius-field, 0rem); color: var(--color-base-100);"
                  bind:value={checkIn}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Check-out Date */}
              <div class="form-control">
                <label class="label" for="hero-checkout-date">
                  <span
                    class="font-secondary text-sm label-text"
                    style="color: color-mix(in srgb, var(--color-base-100) 90%, transparent);"
                  >
                    Check-out
                  </span>
                </label>
                <input
                  id="hero-checkout-date"
                  type="date"
                  class="input-bordered focus:border-primary focus:outline-none w-full transition-all duration-200 input h-12"
                  style="background: transparent; border: 1px solid color-mix(in srgb, var(--color-base-100) 40%, transparent); border-radius: var(--radius-field, 0rem); color: var(--color-base-100);"
                  bind:value={checkOut}
                  min={checkIn.value || new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Guests Selection */}
              <div class="form-control">
                <label class="label" for="hero-guests">
                  <span
                    class="font-secondary text-sm label-text"
                    style="color: color-mix(in srgb, var(--color-base-100) 90%, transparent);"
                  >
                    Guests
                  </span>
                </label>
                <div class="flex gap-2">
                  <select
                    id="hero-guests"
                    class="flex-1 focus:border-primary focus:outline-none transition-all duration-200 select-bordered select h-12"
                    style="background: transparent; border: 1px solid color-mix(in srgb, var(--color-base-100) 40%, transparent); border-radius: var(--radius-selector, 0rem); color: var(--color-base-100);"
                    bind:value={adults}
                  >
                    <option value="1">1 Adult</option>
                    <option value="2">2 Adults</option>
                    <option value="3">3 Adults</option>
                    <option value="4">4 Adults</option>
                    <option value="5">5 Adults</option>
                    <option value="6">6 Adults</option>
                  </select>
                  <select
                    class="flex-1 focus:border-primary focus:outline-none transition-all duration-200 select-bordered select h-12"
                    style="background: transparent; border: 1px solid color-mix(in srgb, var(--color-base-100) 40%, transparent); border-radius: var(--radius-selector, 0rem); color: var(--color-base-100);"
                    bind:value={children}
                  >
                    <option value="0">0 Kids</option>
                    <option value="1">1 Kid</option>
                    <option value="2">2 Kids</option>
                    <option value="3">3 Kids</option>
                    <option value="4">4 Kids</option>
                  </select>
                </div>
              </div>

              {/* Search Button */}
              <div class="form-control">
                <label class="label">
                  <span class="font-secondary text-transparent text-sm label-text">
                    Action
                  </span>
                </label>
                <button
                  type="button"
                  class={`btn btn-primary w-full h-12 min-h-12 ${state.isLoading ? 'loading' : ''} transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]`}
                  style="border-radius: var(--radius-box, 0rem); background: linear-gradient(135deg, var(--color-primary) 0%, color-mix(in srgb, var(--color-primary) 90%, var(--color-secondary)) 100%); color: var(--color-primary-content);"
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
                      <span
                        class="font-secondary"
                        style="color: var(--color-primary-content);"
                      >
                        Search Rooms
                      </span>
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
                    class="flex-shrink-0 mr-2 w-4 h-4 text-error"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <title>Error icon</title>
                    <path
                      fill-rule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span class="font-secondary text-error text-sm">
                    {state.error}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);
