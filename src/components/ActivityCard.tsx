/** @jsxImportSource @builder.io/qwik */
import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';

interface ActivityCardProps {
  name: string;
  description: string;
  maxParticipants?: number;
  ageRestriction?: number;
  equipmentProvided?: string[];
  operatingHours?: Record<string, unknown>;
  defaultCurrency: string;
  imageUrl: string;
  videoUrl?: string;
  isLast: boolean;
  isOdd: boolean;
  hotelSlug: string;
  activitySlug: string;
  isSubdomain?: boolean;
}

export const ActivityCard = component$<ActivityCardProps>(
  ({
    name,
    description,
    maxParticipants,
    ageRestriction,
    equipmentProvided: _equipmentProvided,
    operatingHours: _operatingHours,
    defaultCurrency: _defaultCurrency,
    imageUrl,
    videoUrl,
    isLast,
    isOdd,
    hotelSlug,
    activitySlug,
    isSubdomain = false,
  }) => {
    const cardRef = useSignal<HTMLDivElement>();
    const isHovered = useSignal(false);

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
        class={`bg-base-100 border-2 border-base-300 hover:border-secondary transition-all duration-300 card overflow-hidden ${
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
            {maxParticipants && (
              <div class="flex items-center">
                <svg
                  class="mr-1 w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <title>People icon</title>
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
                Max {maxParticipants} people
              </div>
            )}
            {ageRestriction && ageRestriction > 0 && (
              <div class="flex items-center">
                <svg
                  class="mr-1 w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <title>Age restriction icon</title>
                  <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clip-rule="evenodd"
                  />
                </svg>
                {ageRestriction}+ years
              </div>
            )}
          </div>

          <div class="justify-between items-center pt-4 border-t border-base-200 card-actions">
            <div class="text-left">
              <div class="text-xs text-base-content/50 uppercase tracking-wide">
                Activity
              </div>
              <div class="text-primary/90 text-2xl">Available</div>
            </div>
            <a
              href={
                isSubdomain
                  ? `/activities/${activitySlug}`
                  : `/${hotelSlug}/activities/${activitySlug}`
              }
              class="btn btn-secondary btn-sm"
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
