/** @jsxImportSource @builder.io/qwik */
import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';

interface FacilityCardProps {
  name: string;
  description: string;
  facilityType?: string;
  capacity?: number;
  accessType?: string;
  imageUrl: string;
  videoUrl?: string;
  isLast: boolean;
  isOdd: boolean;
  hotelSlug: string;
  facilitySlug: string;
  isSubdomain?: boolean;
}

export const FacilityCard = component$<FacilityCardProps>(
  ({
    name,
    description,
    facilityType: _facilityType,
    capacity,
    accessType,
    imageUrl,
    videoUrl,
    isLast,
    isOdd,
    hotelSlug,
    facilitySlug,
    isSubdomain = false,
  }) => {
    const cardRef = useSignal<HTMLDivElement>();

    useVisibleTask$(() => {
      const card = cardRef.value;
      if (!card) return;

      const handleMouseEnter = () => {
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
        class={`bg-base-100 border-2 border-base-300 hover:border-accent transition-all duration-300 card overflow-hidden ${
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
            {capacity && (
              <div class="flex items-center">
                <svg
                  class="mr-1 w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <title>Capacity icon</title>
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
                {capacity} capacity
              </div>
            )}
          </div>

          <div class="justify-between items-center pt-4 border-t border-base-200 card-actions">
            <div class="text-left">
              <div class="text-xs text-base-content/50 uppercase tracking-wide">
                Access
              </div>
              <div class="font-semibold text-primary text-lg">
                {accessType || 'Available'}
              </div>
            </div>
            <a
              href={
                isSubdomain
                  ? `/facilities/${facilitySlug}`
                  : `/${hotelSlug}/facilities/${facilitySlug}`
              }
              class="btn btn-accent btn-sm"
            >
              Learn More
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
    );
  }
);
