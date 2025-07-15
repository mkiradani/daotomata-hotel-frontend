/** @jsxImportSource @builder.io/qwik */
import {
  $,
  component$,
  useSignal,
  useVisibleTask$,
  useTask$,
} from '@builder.io/qwik';

interface RatePlan {
  id: string;
  name: string;
  description: string;
  rate_type: 'standard' | 'package' | 'promotional';
  currency: string;
  policies: {
    cancellation_policy: string;
    non_refundable: boolean;
  };
  inclusions: string[];
}

interface RoomCardProps {
  name: string;
  description: string;
  bedConfiguration?: string;
  sizeSqm?: string;
  basePrice?: string;
  defaultCurrency: string;
  imageUrl: string;
  videoUrl?: string;
  isLast: boolean;
  isOdd: boolean;
  roomSlug: string;
}

export const RoomCard = component$<RoomCardProps>(
  ({
    name,
    description,
    bedConfiguration,
    sizeSqm,
    basePrice,
    defaultCurrency,
    imageUrl,
    videoUrl,
    isLast,
    isOdd,
    roomSlug,
  }) => {
    const cardRef = useSignal<HTMLDivElement>();
    const isHovered = useSignal(false);
    const showBookingModal = useSignal(false);
    const ratePlans = useSignal<RatePlan[]>([]);
    const selectedRatePlan = useSignal<RatePlan | null>(null);
    const isLoadingRatePlans = useSignal(false);

    const openBookingModal = $(() => {
      showBookingModal.value = true;
    });

    const closeBookingModal = $(() => {
      showBookingModal.value = false;
    });

    // Load rate plans when component mounts
    useTask$(async () => {
      try {
        isLoadingRatePlans.value = true;
        const response = await fetch('/api/booking/rate-plans');
        const data = await response.json();

        if (data.success && data.data?.data) {
          ratePlans.value = data.data.data;
          // Select first rate plan by default
          if (data.data.data.length > 0) {
            selectedRatePlan.value = data.data.data[0];
          }
        }
      } catch (error) {
        console.error('Failed to load rate plans:', error);
      } finally {
        isLoadingRatePlans.value = false;
      }
    });

    useVisibleTask$(() => {
      const card = cardRef.value;
      if (!card) return;

      const handleMouseEnter = () => {
        isHovered.value = true;
        const img = card.querySelector('img') as HTMLImageElement;
        const video = card.querySelector('video') as HTMLVideoElement;

        if (img) {
          img.style.opacity = '0';
        }

        if (video && videoUrl) {
          video.style.opacity = '1';
          if (!video.src) {
            video.src = videoUrl;
            video.load();
          }
          video.play().catch(() => {});
        }
      };

      const handleMouseLeave = () => {
        isHovered.value = false;
        const img = card.querySelector('img') as HTMLImageElement;
        const video = card.querySelector('video') as HTMLVideoElement;

        if (img) {
          img.style.opacity = '1';
        }

        if (video) {
          video.style.opacity = '0';
          video.pause();
          video.currentTime = 0;
        }
      };

      card.addEventListener('mouseenter', handleMouseEnter);
      card.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        card.removeEventListener('mouseenter', handleMouseEnter);
        card.removeEventListener('mouseleave', handleMouseLeave);
      };
    });

    return (
      <div
        ref={cardRef}
        class={`bg-base-100 border border-base-300 hover:border-primary transition-all duration-300 rounded-lg overflow-hidden ${
          isOdd && isLast ? 'md:col-span-2 lg:col-span-2' : ''
        }`}
      >
        {imageUrl && (
          <figure class="relative overflow-hidden">
            <img
              src={imageUrl}
              alt={name}
              class="opacity-100 w-full object-cover aspect-video transition-opacity duration-300"
            />
            {videoUrl && (
              <video
                class="absolute inset-0 opacity-0 w-full h-full object-cover aspect-video transition-opacity duration-300"
                muted
                loop
                preload="none"
              />
            )}
          </figure>
        )}

        <div class="p-6 card-body">
          <h3 class="mb-3 font-primary text-primary text-xl card-title">
            {name}
          </h3>

          <p class="mb-4 text-sm text-base-content/70 line-clamp-3 leading-relaxed">
            {description}
          </p>

          <div class="flex flex-wrap gap-4 mb-6 text-sm text-base-content/70">
            {sizeSqm && (
              <div class="flex items-center">
                <svg
                  class="mr-1 w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <title>Room size icon</title>
                  <path
                    fill-rule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2v8h10V6H5z"
                    clip-rule="evenodd"
                  />
                </svg>
                {sizeSqm}m²
              </div>
            )}
          </div>

          <div class="justify-between items-center pt-4 border-t border-base-200 card-actions">
            <div class="text-left">
              <div class="text-xs text-base-content/50 uppercase tracking-wide">
                From
              </div>
              <div class="text-primary/90 text-2xl">
                {defaultCurrency} {basePrice || 'Contact'}
              </div>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                class="btn btn-primary btn-sm"
                onClick$={openBookingModal}
              >
                Book Now
              </button>
              <a href={`/rooms/${roomSlug}`} class="btn-outline btn btn-sm">
                Details
                <svg
                  class="ml-1 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>Arrow right icon</title>
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Booking Modal */}
        {showBookingModal.value && (
          <div class="modal modal-open">
            <div class="max-w-4xl modal-box">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-base-content/80 text-lg">Book {name}</h3>
                <button
                  type="button"
                  class="btn btn-sm btn-circle btn-ghost"
                  onClick$={closeBookingModal}
                >
                  ✕
                </button>
              </div>

              <div class="bg-base-200 mb-4 p-4 rounded-lg">
                <div class="flex justify-between items-center">
                  <div>
                    <h4 class="text-base-content/80">{name}</h4>
                    <p class="opacity-70 text-sm">
                      {bedConfiguration || 'Room'}
                    </p>
                  </div>
                  <div class="text-right">
                    <div class="text-primary/90 text-2xl">
                      {defaultCurrency} {basePrice}
                    </div>
                    <p class="opacity-70 text-sm">per night</p>
                  </div>
                </div>
              </div>

              {/* Rate Plans Selection */}
              {isLoadingRatePlans.value ? (
                <div class="py-8 text-center">
                  <div class="loading loading-spinner loading-lg"></div>
                  <p class="opacity-70 mt-4 text-sm">Loading rate plans...</p>
                </div>
              ) : ratePlans.value.length > 0 ? (
                <div class="mb-6">
                  <h4 class="mb-4 font-medium text-lg">Select Rate Plan</h4>
                  <div class="space-y-3">
                    {ratePlans.value.map((plan, index) => (
                      <div
                        key={plan.id || index}
                        class={`border-2 p-4 rounded-lg cursor-pointer transition-all ${
                          selectedRatePlan.value?.id === plan.id
                            ? 'border-primary bg-primary/5'
                            : 'border-base-300 hover:border-primary/50'
                        }`}
                        onClick$={() => {
                          selectedRatePlan.value = plan;
                        }}
                      >
                        <div class="flex justify-between items-start">
                          <div class="flex-1">
                            <h5 class="font-medium text-base">
                              {plan.name || `Rate Plan ${index + 1}`}
                            </h5>
                            {plan.description && (
                              <p class="opacity-70 mt-1 text-sm">
                                {plan.description}
                              </p>
                            )}
                            <div class="flex flex-wrap gap-2 mt-2">
                              {plan.inclusions?.map((inclusion, idx) => (
                                <span
                                  key={idx}
                                  class="bg-base-200 px-2 py-1 rounded text-xs"
                                >
                                  {inclusion}
                                </span>
                              ))}
                            </div>
                            <p class="opacity-60 mt-2 text-xs">
                              {plan.policies?.cancellation_policy}
                            </p>
                          </div>
                          <div class="ml-4 text-right">
                            <span
                              class={`badge ${
                                plan.rate_type === 'promotional'
                                  ? 'badge-secondary'
                                  : plan.rate_type === 'package'
                                    ? 'badge-accent'
                                    : 'badge-neutral'
                              }`}
                            >
                              {plan.rate_type}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div class="py-8 text-center">
                  <p class="mb-4 text-lg">Rate plans not available</p>
                  <p class="opacity-70 mb-6 text-sm">
                    Please contact reception for pricing information.
                  </p>
                </div>
              )}

              {/* Booking Actions */}
              <div class="flex justify-center gap-2">
                <button
                  type="button"
                  class="btn btn-primary"
                  onClick$={closeBookingModal}
                >
                  Contact Reception
                </button>
                <a href={`/rooms/${roomSlug}`} class="btn-outline btn">
                  View Room Details
                </a>
              </div>

              <div class="modal-action">
                <button type="button" class="btn" onClick$={closeBookingModal}>
                  Close
                </button>
              </div>
            </div>
            <div class="modal-backdrop" onClick$={closeBookingModal}></div>
          </div>
        )}
      </div>
    );
  }
);
