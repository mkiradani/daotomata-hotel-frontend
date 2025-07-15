/** @jsxImportSource @builder.io/qwik */
import {
  $,
  component$,
  useSignal,
  useStore,
  useTask$,
  useVisibleTask$,
} from '@builder.io/qwik';

interface BookingWidgetRealProps {
  hotelDomain: string;
  hotelName: string;
  defaultCurrency: string;
  className?: string;
  compact?: boolean;
}

interface RoomAvailability {
  roomId: string;
  roomType: string;
  available: boolean;
  price: number;
  currency: string;
  maxOccupancy: number;
  checkIn: string;
  checkOut: string;
  directusRoom?: {
    id: string;
    name: string;
    description: string;
    room_type: string;
    max_occupancy: number;
    size_sqm?: number;
    bed_configuration?: string;
    amenities?: string[];
    is_accesible?: boolean;
    main_photo?: {
      id: string;
      filename_disk: string;
      title: string;
    };
  };
}

interface RoomRate {
  roomId: string;
  roomType: string;
  basePrice: number;
  totalPrice: number;
  currency: string;
  taxes?: number;
  fees?: number;
  directusRoom?: {
    id: string;
    name: string;
    description: string;
    room_type: string;
    max_occupancy: number;
    size_sqm?: number;
  };
}

export const BookingWidgetReal = component$<BookingWidgetRealProps>(
  ({
    hotelDomain: _hotelDomain,
    hotelName,
    defaultCurrency: _defaultCurrency,
    className = '',
    compact = false,
  }) => {
    // Helper function for media URLs
    const getImageUrl = (photoId: string) => {
      if (!photoId) return null;
      return `https://hotels.daotomata.io/assets/${photoId}?width=400&height=250&quality=90`;
    };
    // Form state
    const checkIn = useSignal('');
    const checkOut = useSignal('');
    const adults = useSignal('2');
    const children = useSignal('0');
    const rooms = useSignal('1');

    // UI state using useStore for better reactivity in Astro
    const state = useStore({
      isLoading: false,
      error: '',
      availability: [] as RoomAvailability[],
      rates: [] as RoomRate[],
      showResults: false,
      showBookingForm: false,
      selectedRoom: null as RoomAvailability | null,
    });

    // Force render trigger for Qwik reactivity
    const renderTrigger = useSignal(0);

    // Booking form state
    const guestFirstName = useSignal('');
    const guestLastName = useSignal('');
    const guestEmail = useSignal('');
    const guestPhone = useSignal('');
    const guestCountry = useSignal('US'); // Default to US
    const paymentMethod = useSignal('cash'); // Default to cash
    const specialRequests = useSignal('');

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

    // Force reactivity for state updates - useVisibleTask$ to ensure proper re-rendering
    useVisibleTask$(({ track }) => {
      // Track all relevant state changes to force re-render
      track(() => state.showResults);
      track(() => state.availability.length);
      track(() => state.showBookingForm);
    });

    // Search for availability and rates
    const searchAvailability = $(async () => {
      if (!checkIn.value || !checkOut.value) {
        state.error = 'Please select check-in and check-out dates';
        return;
      }

      state.isLoading = true;
      state.error = '';

      try {
        // Call availability API
        const availabilityResponse = await fetch('/api/booking/availability', {
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

        const availabilityData = await availabilityResponse.json();

        if (!availabilityData.success) {
          throw new Error(
            availabilityData.error || 'Failed to check availability'
          );
        }

        // Call rates API
        const ratesResponse = await fetch('/api/booking/rates', {
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

        const ratesData = await ratesResponse.json();

        if (!ratesData.success) {
          throw new Error(ratesData.error || 'Failed to get rates');
        }

        // Update store properties directly - useStore handles reactivity properly
        state.availability = availabilityData.availability || [];
        state.rates = ratesData.rates || [];
        state.showResults = true;

        // Force re-render by updating render trigger
        renderTrigger.value++;
      } catch (err) {
        state.error =
          err instanceof Error ? err.message : 'Failed to search availability';
        state.availability = [];
        state.rates = [];
        state.showResults = false;
      } finally {
        state.isLoading = false;
      }
    });

    // Book a room
    const selectRoom = $(async (room: RoomAvailability) => {
      state.selectedRoom = room;
      state.showBookingForm = true;
    });

    // Submit booking
    const submitBooking = $(async () => {
      if (!state.selectedRoom) return;

      if (!guestFirstName.value || !guestLastName.value || !guestEmail.value) {
        state.error = 'Please fill in all required guest information';
        return;
      }

      state.isLoading = true;
      state.error = '';

      try {
        const bookingRequest = {
          checkIn: checkIn.value,
          checkOut: checkOut.value,
          adults: parseInt(adults.value),
          children:
            parseInt(children.value) > 0 ? parseInt(children.value) : undefined,
          rooms: parseInt(rooms.value),
          roomType: state.selectedRoom.roomType,
          guestInfo: {
            firstName: guestFirstName.value,
            lastName: guestLastName.value,
            email: guestEmail.value,
            phone: guestPhone.value || undefined,
            country: guestCountry.value,
          },
          paymentMethod: paymentMethod.value,
          specialRequests: specialRequests.value || undefined,
        };

        console.log(
          '📝 [FRONTEND] Sending booking request:',
          JSON.stringify(bookingRequest, null, 2)
        );

        const bookingResponse = await fetch('/api/booking/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingRequest),
        });

        const bookingData = await bookingResponse.json();

        if (bookingData.success && bookingData.booking.success) {
          // Show success message
          alert(
            `Booking successful! Confirmation: ${bookingData.booking.confirmationNumber || bookingData.booking.bookingId}`
          );

          // Reset form
          state.showBookingForm = false;
          state.showResults = false;
          state.selectedRoom = null;
          guestFirstName.value = '';
          guestLastName.value = '';
          guestEmail.value = '';
          guestPhone.value = '';
          guestCountry.value = 'US';
          paymentMethod.value = 'cash';
          specialRequests.value = '';
        } else {
          throw new Error(
            bookingData.error ||
              bookingData.booking?.error ||
              'Failed to create booking'
          );
        }
      } catch (err) {
        state.error =
          err instanceof Error ? err.message : 'Failed to create booking';
      } finally {
        state.isLoading = false;
      }
    });

    const formatPrice = (amount: number, currency: string) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    };

    const calculateNights = () => {
      if (!checkIn.value || !checkOut.value) return 0;
      const start = new Date(checkIn.value);
      const end = new Date(checkOut.value);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const getRoomRate = (roomId: string) => {
      return state.rates.find((rate) => rate.roomId === roomId);
    };

    return (
      <div class={`booking-widget-real ${className}`}>
        <div class="bg-base-100 border border-base-300 rounded-lg">
          <div class="p-6">
            <h3 class="mb-6 font-semibold text-primary text-xl">
              {compact ? 'Book Now' : `Book Your Stay at ${hotelName}`}
            </h3>

            {/* Search Form */}
            {!state.showBookingForm && (
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
                        Searching Rooms...
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
                        Search Available Rooms
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

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
                  <p class="mt-4 text-base-content/70">
                    Searching for available rooms...
                  </p>
                </div>
              </div>
            )}

            {/* Results */}
            {(() => {
              // Include render trigger to force reactivity
              const _trigger = renderTrigger.value;

              const shouldRender =
                state.showResults &&
                state.availability.length > 0 &&
                !state.showBookingForm;

              return shouldRender;
            })() && (
              <div class="mt-6">
                <h4 class="mb-4 text-base-content/80 text-lg">
                  Available Rooms ({calculateNights()} nights)
                </h4>

                <div class="gap-6 grid grid-cols-1 lg:grid-cols-2">
                  {state.availability.map((room) => {
                    const rate = getRoomRate(room.roomId);
                    const displayName =
                      room.directusRoom?.name || room.roomType;
                    const description = room.directusRoom?.description;

                    const imageUrl = room.directusRoom?.main_photo?.id
                      ? getImageUrl(room.directusRoom.main_photo.id)
                      : null;

                    return (
                      <div
                        key={room.roomId}
                        class="bg-base-100 border hover:border-primary border-base-300 rounded-lg overflow-hidden transition-all duration-300"
                      >
                        {/* Room Image */}
                        {imageUrl && (
                          <figure class="relative overflow-hidden">
                            <img
                              src={imageUrl}
                              alt={displayName}
                              class="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                            />
                            {room.directusRoom?.is_accesible && (
                              <div class="top-3 right-3 absolute bg-primary px-3 py-1 rounded-full font-medium text-primary-content text-xs">
                                ♿ Accessible
                              </div>
                            )}
                          </figure>
                        )}

                        <div class="p-6">
                          <div class="mb-4">
                            <h5 class="mb-2 font-primary font-semibold text-primary text-xl">
                              {displayName}
                            </h5>
                            {description && (
                              <p class="text-sm text-base-content/70 line-clamp-2 leading-relaxed">
                                {description}
                              </p>
                            )}
                          </div>

                          {/* Room Features */}
                          <div class="flex flex-wrap gap-2 mb-4">
                            <span class="badge-outline badge badge-sm">
                              <svg
                                class="mr-1 w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <title>WiFi icon</title>
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                              </svg>
                              Free WiFi
                            </span>
                            <span class="badge-outline badge badge-sm">
                              <svg
                                class="mr-1 w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <title>Cancel icon</title>
                                <path
                                  fill-rule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clip-rule="evenodd"
                                />
                              </svg>
                              Free Cancellation
                            </span>
                            {room.directusRoom?.bed_configuration && (
                              <span class="badge-outline badge badge-sm">
                                🛏️ {room.directusRoom.bed_configuration}
                              </span>
                            )}
                          </div>

                          <div class="flex flex-wrap gap-4 mb-4 text-sm text-base-content/70">
                            <div class="flex items-center">
                              <svg
                                class="mr-1 w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <title>Occupancy icon</title>
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                              </svg>
                              {room.maxOccupancy} guests
                            </div>
                            {room.directusRoom?.size_sqm && (
                              <div class="flex items-center">
                                <svg
                                  class="mr-1 w-4 h-4"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <title>Size icon</title>
                                  <path
                                    fill-rule="evenodd"
                                    d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2v8h10V6H5z"
                                    clip-rule="evenodd"
                                  />
                                </svg>
                                {room.directusRoom.size_sqm}m²
                              </div>
                            )}
                          </div>

                          {/* Pricing Section */}
                          <div class="flex justify-between items-end pt-4 border-t border-base-200">
                            <div class="text-left">
                              {rate && rate.taxes && rate.taxes > 0 && (
                                <div class="mb-1 text-xs text-base-content/50">
                                  Base:{' '}
                                  {formatPrice(rate.basePrice, rate.currency)} +
                                  Tax: {formatPrice(rate.taxes, rate.currency)}
                                </div>
                              )}
                              <div class="text-xs text-base-content/50 uppercase tracking-wide">
                                Total per night
                              </div>
                              <div class="font-bold text-primary text-3xl">
                                {rate
                                  ? formatPrice(rate.totalPrice, rate.currency)
                                  : formatPrice(room.price, room.currency)}
                              </div>
                              <div class="mt-1 text-xs text-base-content/60">
                                {calculateNights()} nights • Total:{' '}
                                {rate
                                  ? formatPrice(
                                      rate.totalPrice * calculateNights(),
                                      rate.currency
                                    )
                                  : formatPrice(
                                      room.price * calculateNights(),
                                      room.currency
                                    )}
                              </div>
                            </div>
                            <div class="text-right">
                              <button
                                type="button"
                                class="px-6 hover:scale-105 transition-transform btn btn-primary btn-lg"
                                onClick$={() => selectRoom(room)}
                                disabled={state.isLoading}
                              >
                                <svg
                                  class="mr-2 w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <title>Calendar icon</title>
                                  <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                Book Now
                              </button>
                              <div class="mt-2 text-xs text-base-content/60">
                                Free cancellation until 24h before
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {state.showResults &&
              state.availability.length === 0 &&
              !state.showBookingForm && (
                <div class="mt-6 py-12 text-center">
                  <div class="flex justify-center items-center bg-base-200 mx-auto mb-6 rounded-full w-24 h-24">
                    <svg
                      class="w-12 h-12 text-base-content/40"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <title>No rooms icon</title>
                      <path
                        fill-rule="evenodd"
                        d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2v8h10V6H5z"
                        clip-rule="evenodd"
                      />
                      <path d="M7 8h6v2H7V8zM7 12h4v2H7v-2z" />
                    </svg>
                  </div>
                  <h3 class="mb-2 text-base-content/80 text-xl">
                    No Rooms Available
                  </h3>
                  <p class="mb-6 text-base-content/60">
                    Unfortunately, no rooms are available for your selected
                    dates.
                  </p>
                  <div class="space-y-3">
                    <p class="text-sm text-base-content/70">
                      Try these suggestions:
                    </p>
                    <div class="flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        class="btn-outline btn btn-sm"
                        onClick$={() => {
                          // Suggest dates 1 day later
                          const newCheckIn = new Date(checkIn.value);
                          newCheckIn.setDate(newCheckIn.getDate() + 1);
                          const newCheckOut = new Date(checkOut.value);
                          newCheckOut.setDate(newCheckOut.getDate() + 1);
                          checkIn.value = newCheckIn
                            .toISOString()
                            .split('T')[0];
                          checkOut.value = newCheckOut
                            .toISOString()
                            .split('T')[0];
                        }}
                      >
                        Try Next Day
                      </button>
                      <button
                        type="button"
                        class="btn-outline btn btn-sm"
                        onClick$={() => {
                          // Reduce stay by 1 night
                          const newCheckOut = new Date(checkOut.value);
                          newCheckOut.setDate(newCheckOut.getDate() - 1);
                          checkOut.value = newCheckOut
                            .toISOString()
                            .split('T')[0];
                        }}
                      >
                        Shorter Stay
                      </button>
                      <a href="/contact" class="btn btn-sm btn-primary">
                        Contact Us
                      </a>
                    </div>
                  </div>
                </div>
              )}

            {/* Booking Form */}
            {state.showBookingForm && state.selectedRoom && (
              <div class="mt-6">
                <div class="flex justify-between items-center mb-4">
                  <h4 class="text-base-content/80 text-lg">
                    Complete Your Booking
                  </h4>
                  <button
                    type="button"
                    class="btn btn-sm btn-ghost"
                    onClick$={() => {
                      state.showBookingForm = false;
                      state.selectedRoom = null;
                    }}
                  >
                    ← Back to Results
                  </button>
                </div>

                {/* Selected Room Summary */}
                <div class="bg-primary/10 mb-6 card">
                  <div class="card-body">
                    <h5 class="font-semibold">
                      {state.selectedRoom.directusRoom?.name ||
                        state.selectedRoom.roomType}
                    </h5>
                    <div class="gap-4 grid grid-cols-2 text-sm">
                      <div>
                        <p>
                          <strong>Check-in:</strong> {checkIn.value}
                        </p>
                        <p>
                          <strong>Check-out:</strong> {checkOut.value}
                        </p>
                        <p>
                          <strong>Nights:</strong> {calculateNights()}
                        </p>
                      </div>
                      <div>
                        <p>
                          <strong>Guests:</strong> {adults.value} adults
                          {parseInt(children.value) > 0
                            ? `, ${children.value} children`
                            : ''}
                        </p>
                        <p>
                          <strong>Rooms:</strong> {rooms.value}
                        </p>
                        <div class="text-right">
                          <div class="text-primary/90 text-xl">
                            {(() => {
                              const rate = getRoomRate(
                                state.selectedRoom?.roomId
                              );
                              return rate
                                ? formatPrice(rate.totalPrice, rate.currency)
                                : formatPrice(
                                    state.selectedRoom?.price,
                                    state.selectedRoom?.currency
                                  );
                            })()}
                          </div>
                          <p class="opacity-70 text-xs">per night</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Guest Information Form */}
                <div class="space-y-4">
                  <h5 class="font-semibold">Guest Information</h5>

                  <div class="gap-4 grid grid-cols-1 md:grid-cols-2">
                    <div class="form-control">
                      <label class="label" for="first-name">
                        <span class="label-text">First Name *</span>
                      </label>
                      <input
                        id="first-name"
                        type="text"
                        class="input-bordered input"
                        bind:value={guestFirstName}
                        placeholder="Enter first name"
                        required
                      />
                    </div>

                    <div class="form-control">
                      <label class="label" for="last-name">
                        <span class="label-text">Last Name *</span>
                      </label>
                      <input
                        id="last-name"
                        type="text"
                        class="input-bordered input"
                        bind:value={guestLastName}
                        placeholder="Enter last name"
                        required
                      />
                    </div>

                    <div class="form-control">
                      <label class="label" for="guest-email">
                        <span class="label-text">Email *</span>
                      </label>
                      <input
                        id="guest-email"
                        type="email"
                        class="input-bordered input"
                        bind:value={guestEmail}
                        placeholder="Enter email address"
                        required
                      />
                    </div>

                    <div class="form-control">
                      <label class="label" for="guest-phone">
                        <span class="label-text">Phone</span>
                      </label>
                      <input
                        id="guest-phone"
                        type="tel"
                        class="input-bordered input"
                        bind:value={guestPhone}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  <div class="gap-4 grid grid-cols-1 md:grid-cols-2">
                    <div class="form-control">
                      <label class="label" for="guest-country">
                        <span class="label-text">Country *</span>
                      </label>
                      <select
                        id="guest-country"
                        class="select-bordered select"
                        bind:value={guestCountry}
                        required
                      >
                        <option value="US">United States</option>
                        <option value="ES">Spain</option>
                        <option value="FR">France</option>
                        <option value="DE">Germany</option>
                        <option value="IT">Italy</option>
                        <option value="GB">United Kingdom</option>
                        <option value="CA">Canada</option>
                        <option value="MX">Mexico</option>
                        <option value="BR">Brazil</option>
                        <option value="AR">Argentina</option>
                      </select>
                    </div>

                    <div class="form-control">
                      <label class="label" for="payment-method">
                        <span class="label-text">Payment Method *</span>
                      </label>
                      <select
                        id="payment-method"
                        class="select-bordered select"
                        bind:value={paymentMethod}
                        required
                      >
                        <option value="cash">Cash at Reception</option>
                        <option value="credit_card">Credit Card</option>
                        <option value="bank_transfer">Bank Transfer</option>
                      </select>
                    </div>
                  </div>

                  <div class="form-control">
                    <label class="label" for="special-requests">
                      <span class="label-text">Special Requests</span>
                    </label>
                    <textarea
                      id="special-requests"
                      class="textarea-bordered textarea"
                      bind:value={specialRequests}
                      placeholder="Any special requests or preferences..."
                      rows={3}
                    ></textarea>
                  </div>

                  {/* Booking Actions */}
                  <div class="justify-end pt-4 card-actions">
                    <button
                      type="button"
                      class="btn-outline btn"
                      onClick$={() => {
                        state.showBookingForm = false;
                        state.selectedRoom = null;
                      }}
                      disabled={state.isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      class={`btn btn-primary ${state.isLoading ? 'loading' : ''}`}
                      onClick$={submitBooking}
                      disabled={
                        state.isLoading ||
                        !guestFirstName.value ||
                        !guestLastName.value ||
                        !guestEmail.value
                      }
                    >
                      {state.isLoading ? 'Processing...' : 'Confirm Booking'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);
