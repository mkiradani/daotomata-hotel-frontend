/** @jsxImportSource @builder.io/qwik */
import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';

interface RoomCardProps {
  name: string;
  description: string;
  roomType: string;
  maxOccupancy: number;
  sizeSqm?: number;
  basePrice?: string;
  defaultCurrency: string;
  imageUrl: string;
  videoUrl?: string;
  isLast: boolean;
  isOdd: boolean;
  hotelSlug: string;
  roomSlug: string;
}

export const RoomCard = component$<RoomCardProps>(({
  name,
  description,
  roomType,
  maxOccupancy,
  sizeSqm,
  basePrice,
  defaultCurrency,
  imageUrl,
  videoUrl,
  isLast,
  isOdd,
  hotelSlug,
  roomSlug
}) => {
  const cardRef = useSignal<HTMLDivElement>();
  const isHovered = useSignal(false);
  const showBookingModal = useSignal(false);

  const openBookingModal = $(() => {
    showBookingModal.value = true;
  });

  const closeBookingModal = $(() => {
    showBookingModal.value = false;
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
      class={`bg-base-100 border-2 border-base-300 hover:border-primary transition-all duration-300 card overflow-hidden ${
        isOdd && isLast ? 'md:col-span-2' : ''
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
          <div class="top-4 right-4 z-10 absolute">
            <div class="bg-primary/80 backdrop-blur-sm border border-primary-content/20 font-semibold badge badge-primary badge-lg">
              {roomType}
            </div>
          </div>
        </figure>
      )}
      
      <div class="p-6 card-body">
        <h3 class="mb-3 font-head text-primary text-xl card-title">
          {name}
        </h3>

        <p class="mb-4 text-sm text-base-content/70 line-clamp-3 leading-relaxed">
          {description}
        </p>

        <div class="flex flex-wrap gap-2 mb-6">
          <div class="badge-outline badge badge-sm">
            <svg class="mr-1 w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
            </svg>
            {maxOccupancy} guests
          </div>
          {sizeSqm && (
            <div class="badge-outline badge badge-sm">
              <svg class="mr-1 w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2v8h10V6H5z" clip-rule="evenodd"/>
              </svg>
              {sizeSqm}m²
            </div>
          )}
        </div>

        <div class="justify-between items-center pt-4 border-t border-base-200 card-actions">
          <div class="text-left">
            <div class="text-xs text-base-content/50 uppercase tracking-wide">From</div>
            <div class="font-bold text-primary text-2xl">
              {defaultCurrency} {basePrice || 'Contact'}
            </div>
          </div>
          <div class="flex gap-2">
            <button
              class="btn btn-primary btn-sm"
              onClick$={openBookingModal}
            >
              Book Now
            </button>
            <a href={`/${hotelSlug}/rooms/${roomSlug}`} class="btn-outline btn btn-sm">
              Details
              <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
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
              <h3 class="font-bold text-lg">Book {name}</h3>
              <button
                class="btn btn-sm btn-circle btn-ghost"
                onClick$={closeBookingModal}
              >
                ✕
              </button>
            </div>

            <div class="bg-base-200 mb-4 p-4 rounded-lg">
              <div class="flex justify-between items-center">
                <div>
                  <h4 class="font-semibold">{name}</h4>
                  <p class="opacity-70 text-sm">{roomType} • Max {maxOccupancy} guests</p>
                </div>
                <div class="text-right">
                  <div class="font-bold text-primary text-2xl">
                    {defaultCurrency} {basePrice}
                  </div>
                  <p class="opacity-70 text-sm">per night</p>
                </div>
              </div>
            </div>

            {/* Booking form would go here */}
            <div class="py-8 text-center">
              <p class="mb-4 text-lg">Booking functionality coming soon!</p>
              <p class="opacity-70 mb-6 text-sm">
                We're implementing the full booking system with Cloudbeds integration.
              </p>
              <div class="flex justify-center gap-2">
                <button class="btn btn-primary" onClick$={closeBookingModal}>
                  Contact Reception
                </button>
                <a href={`/${hotelSlug}/rooms/${roomSlug}`} class="btn-outline btn">
                  View Room Details
                </a>
              </div>
            </div>

            <div class="modal-action">
              <button class="btn" onClick$={closeBookingModal}>Close</button>
            </div>
          </div>
          <div class="modal-backdrop" onClick$={closeBookingModal}></div>
        </div>
      )}
    </div>
  );
});
