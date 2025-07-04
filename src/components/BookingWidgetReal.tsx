/** @jsxImportSource @builder.io/qwik */
import { $, component$, useSignal, useTask$ } from '@builder.io/qwik';

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
  ({ hotelDomain, hotelName, defaultCurrency: _defaultCurrency, className = '', compact = false }) => {
    // Form state
    const checkIn = useSignal('');
    const checkOut = useSignal('');
    const adults = useSignal(2);
    const children = useSignal(0);
    const rooms = useSignal(1);

    // UI state
    const isLoading = useSignal(false);
    const error = useSignal('');
    const availability = useSignal<RoomAvailability[]>([]);
    const rates = useSignal<RoomRate[]>([]);
    const showResults = useSignal(false);
    const showBookingForm = useSignal(false);
    const selectedRoom = useSignal<RoomAvailability | null>(null);

    // Booking form state
    const guestFirstName = useSignal('');
    const guestLastName = useSignal('');
    const guestEmail = useSignal('');
    const guestPhone = useSignal('');
    const specialRequests = useSignal('');

    // Set default dates
    useTask$(() => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      checkIn.value = today.toISOString().split('T')[0];
      checkOut.value = tomorrow.toISOString().split('T')[0];
    });

    // Search for availability and rates
    const searchAvailability = $(async () => {
      if (!checkIn.value || !checkOut.value) {
        error.value = 'Please select check-in and check-out dates';
        return;
      }

      isLoading.value = true;
      error.value = '';

      try {
        // Call availability API
        const availabilityResponse = await fetch('/api/booking/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hotelDomain,
            checkIn: checkIn.value,
            checkOut: checkOut.value,
            adults: adults.value,
            children: children.value > 0 ? children.value : undefined,
            rooms: rooms.value,
          }),
        });

        const availabilityData = await availabilityResponse.json();

        if (!availabilityData.success) {
          throw new Error(availabilityData.error || 'Failed to check availability');
        }

        // Call rates API
        const ratesResponse = await fetch('/api/booking/rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hotelDomain,
            checkIn: checkIn.value,
            checkOut: checkOut.value,
            adults: adults.value,
            children: children.value > 0 ? children.value : undefined,
            rooms: rooms.value,
          }),
        });

        const ratesData = await ratesResponse.json();

        if (!ratesData.success) {
          throw new Error(ratesData.error || 'Failed to get rates');
        }

        availability.value = availabilityData.availability || [];
        rates.value = ratesData.rates || [];
        showResults.value = true;
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to search availability';
        availability.value = [];
        rates.value = [];
        showResults.value = false;
      } finally {
        isLoading.value = false;
      }
    });

    // Book a room
    const selectRoom = $(async (room: RoomAvailability) => {
      selectedRoom.value = room;
      showBookingForm.value = true;
    });

    // Submit booking
    const submitBooking = $(async () => {
      if (!selectedRoom.value) return;

      if (!guestFirstName.value || !guestLastName.value || !guestEmail.value) {
        error.value = 'Please fill in all required guest information';
        return;
      }

      isLoading.value = true;
      error.value = '';

      try {
        const bookingResponse = await fetch('/api/booking/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hotelDomain,
            checkIn: checkIn.value,
            checkOut: checkOut.value,
            adults: adults.value,
            children: children.value > 0 ? children.value : undefined,
            rooms: rooms.value,
            roomType: selectedRoom.value.roomType,
            guestInfo: {
              firstName: guestFirstName.value,
              lastName: guestLastName.value,
              email: guestEmail.value,
              phone: guestPhone.value || undefined,
            },
            specialRequests: specialRequests.value || undefined,
          }),
        });

        const bookingData = await bookingResponse.json();

        if (bookingData.success && bookingData.booking.success) {
          // Show success message
          alert(
            `Booking successful! Confirmation: ${bookingData.booking.confirmationNumber || bookingData.booking.bookingId}`
          );

          // Reset form
          showBookingForm.value = false;
          showResults.value = false;
          selectedRoom.value = null;
          guestFirstName.value = '';
          guestLastName.value = '';
          guestEmail.value = '';
          guestPhone.value = '';
          specialRequests.value = '';
        } else {
          throw new Error(
            bookingData.error || bookingData.booking?.error || 'Failed to create booking'
          );
        }
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to create booking';
      } finally {
        isLoading.value = false;
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
      return rates.value.find((rate) => rate.roomId === roomId);
    };

    return (
      <div class={`booking-widget-real ${className}`}>
        <div class="bg-base-100 shadow-xl card">
          <div class="card-body">
            <h3 class="text-primary card-title">
              {compact ? 'Book Now' : `Book Your Stay at ${hotelName}`}
            </h3>

            {/* Search Form */}
            {!showBookingForm.value && (
              <div class="space-y-4">
                <div class="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
                  <div class="form-control">
                    <label class="label" for="checkin-date">
                      <span class="label-text">Check-in</span>
                    </label>
                    <input
                      id="checkin-date"
                      type="date"
                      class="input-bordered input"
                      bind:value={checkIn}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div class="form-control">
                    <label class="label" for="checkout-date">
                      <span class="label-text">Check-out</span>
                    </label>
                    <input
                      id="checkout-date"
                      type="date"
                      class="input-bordered input"
                      bind:value={checkOut}
                      min={checkIn.value || new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Adults</span>
                    </label>
                    <select class="select-bordered select" bind:value={adults}>
                      <option value={1}>1 Adult</option>
                      <option value={2}>2 Adults</option>
                      <option value={3}>3 Adults</option>
                      <option value={4}>4 Adults</option>
                    </select>
                  </div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Children</span>
                    </label>
                    <select class="select-bordered select" bind:value={children}>
                      <option value={0}>0 Children</option>
                      <option value={1}>1 Child</option>
                      <option value={2}>2 Children</option>
                      <option value={3}>3 Children</option>
                    </select>
                  </div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Rooms</span>
                    </label>
                    <select class="select-bordered select" bind:value={rooms}>
                      <option value={1}>1 Room</option>
                      <option value={2}>2 Rooms</option>
                      <option value={3}>3 Rooms</option>
                    </select>
                  </div>
                </div>

                {/* Search Button */}
                <div class="justify-center card-actions">
                  <button
                    type="button"
                    class={`btn btn-primary ${isLoading.value ? 'loading' : ''}`}
                    onClick$={searchAvailability}
                    disabled={isLoading.value}
                  >
                    {isLoading.value ? 'Searching...' : 'Search Availability'}
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error.value && (
              <div class="alert alert-error">
                <svg class="stroke-current w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24">
                  <title>Error icon</title>
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{error.value}</span>
              </div>
            )}

            {/* Results */}
            {showResults.value && availability.value.length > 0 && !showBookingForm.value && (
              <div class="mt-6">
                <h4 class="mb-4 font-semibold text-lg">
                  Available Rooms ({calculateNights()} nights)
                </h4>

                <div class="space-y-4">
                  {availability.value.map((room) => {
                    const rate = getRoomRate(room.roomId);
                    const displayName = room.directusRoom?.name || room.roomType;
                    const description = room.directusRoom?.description;

                    return (
                      <div key={room.roomId} class="bg-base-200 card">
                        <div class="card-body">
                          <div class="flex justify-between items-start">
                            <div class="flex-1">
                              <h5 class="text-base card-title">{displayName}</h5>
                              {description && <p class="opacity-70 mb-2 text-sm">{description}</p>}
                              <p class="opacity-70 text-sm">
                                Max occupancy: {room.maxOccupancy} guests
                              </p>
                              {room.directusRoom?.size_sqm && (
                                <p class="opacity-70 text-sm">
                                  Size: {room.directusRoom.size_sqm} m²
                                </p>
                              )}
                              {rate && (
                                <div class="mt-2">
                                  <p class="text-sm">
                                    Base price: {formatPrice(rate.basePrice, rate.currency)} per
                                    night
                                  </p>
                                  {rate.taxes && rate.taxes > 0 && (
                                    <p class="text-sm">
                                      Taxes: {formatPrice(rate.taxes, rate.currency)}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            <div class="text-right">
                              <div class="font-bold text-primary text-2xl">
                                {rate
                                  ? formatPrice(rate.totalPrice, rate.currency)
                                  : formatPrice(room.price, room.currency)}
                              </div>
                              <p class="opacity-70 text-sm">per night</p>
                              <button
                                type="button"
                                class="mt-2 btn btn-primary btn-sm"
                                onClick$={() => selectRoom(room)}
                                disabled={isLoading.value}
                              >
                                Book Now
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {showResults.value && availability.value.length === 0 && !showBookingForm.value && (
              <div class="mt-6 alert alert-info">
                <svg class="stroke-current w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24">
                  <title>Information icon</title>
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>No rooms available for the selected dates. Please try different dates.</span>
              </div>
            )}

            {/* Booking Form */}
            {showBookingForm.value && selectedRoom.value && (
              <div class="mt-6">
                <div class="flex justify-between items-center mb-4">
                  <h4 class="font-semibold text-lg">Complete Your Booking</h4>
                  <button
                    class="btn btn-sm btn-ghost"
                    onClick$={() => {
                      showBookingForm.value = false;
                      selectedRoom.value = null;
                    }}
                  >
                    ← Back to Results
                  </button>
                </div>

                {/* Selected Room Summary */}
                <div class="bg-primary/10 mb-6 card">
                  <div class="card-body">
                    <h5 class="font-semibold">
                      {selectedRoom.value.directusRoom?.name || selectedRoom.value.roomType}
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
                          {children.value > 0 ? `, ${children.value} children` : ''}
                        </p>
                        <p>
                          <strong>Rooms:</strong> {rooms.value}
                        </p>
                        <div class="text-right">
                          <div class="font-bold text-primary text-xl">
                            {(() => {
                              const rate = getRoomRate(selectedRoom.value?.roomId);
                              return rate
                                ? formatPrice(rate.totalPrice, rate.currency)
                                : formatPrice(
                                    selectedRoom.value?.price,
                                    selectedRoom.value?.currency
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
                      <label class="label">
                        <span class="label-text">First Name *</span>
                      </label>
                      <input
                        type="text"
                        class="input-bordered input"
                        bind:value={guestFirstName}
                        placeholder="Enter first name"
                        required
                      />
                    </div>

                    <div class="form-control">
                      <label class="label">
                        <span class="label-text">Last Name *</span>
                      </label>
                      <input
                        type="text"
                        class="input-bordered input"
                        bind:value={guestLastName}
                        placeholder="Enter last name"
                        required
                      />
                    </div>

                    <div class="form-control">
                      <label class="label">
                        <span class="label-text">Email *</span>
                      </label>
                      <input
                        type="email"
                        class="input-bordered input"
                        bind:value={guestEmail}
                        placeholder="Enter email address"
                        required
                      />
                    </div>

                    <div class="form-control">
                      <label class="label">
                        <span class="label-text">Phone</span>
                      </label>
                      <input
                        type="tel"
                        class="input-bordered input"
                        bind:value={guestPhone}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Special Requests</span>
                    </label>
                    <textarea
                      class="textarea-bordered textarea"
                      bind:value={specialRequests}
                      placeholder="Any special requests or preferences..."
                      rows={3}
                    ></textarea>
                  </div>

                  {/* Booking Actions */}
                  <div class="justify-end pt-4 card-actions">
                    <button
                      class="btn-outline btn"
                      onClick$={() => {
                        showBookingForm.value = false;
                        selectedRoom.value = null;
                      }}
                      disabled={isLoading.value}
                    >
                      Cancel
                    </button>
                    <button
                      class={`btn btn-primary ${isLoading.value ? 'loading' : ''}`}
                      onClick$={submitBooking}
                      disabled={
                        isLoading.value ||
                        !guestFirstName.value ||
                        !guestLastName.value ||
                        !guestEmail.value
                      }
                    >
                      {isLoading.value ? 'Processing...' : 'Confirm Booking'}
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
