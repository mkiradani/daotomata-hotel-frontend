/** @jsxImportSource @builder.io/qwik */
import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';

interface RestaurantCardProps {
  name: string;
  description: string;
  imageUrl: string;
  videoUrl?: string;
  hotelSlug: string;
}

export const RestaurantCard = component$<RestaurantCardProps>(
  ({ name, description, imageUrl, videoUrl, hotelSlug }) => {
    const cardRef = useSignal<HTMLDivElement>();
    const isHovered = useSignal(false);

    useVisibleTask$(({ track }) => {
      track(() => isHovered.value);

      if (!cardRef.value) return;

      const video = cardRef.value.querySelector('video');
      if (!video) return;

      if (isHovered.value) {
        video.style.opacity = '1';
        video.play().catch(() => {
          // Video play failed, ignore
        });
      } else {
        video.style.opacity = '0';
        video.pause();
        video.currentTime = 0;
      }
    });

    return (
      <div
        ref={cardRef}
        class="bg-base-100 border-2 hover:border-accent border-base-300 overflow-hidden transition-all duration-300 card"
        onMouseEnter$={() => {
          isHovered.value = true;
        }}
        onMouseLeave$={() => {
          isHovered.value = false;
        }}
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
              <div class="bg-accent/80 backdrop-blur-sm border border-accent-content/20 font-semibold badge badge-accent badge-lg">
                Restaurant
              </div>
            </div>
          </figure>
        )}

        <div class="p-6 card-body">
          <h3 class="mb-3 font-primary text-primary text-xl card-title">{name}</h3>

          <p class="mb-4 text-sm text-base-content/70 line-clamp-3 leading-relaxed">
            {description}
          </p>

          <div class="justify-between items-center pt-4 border-t border-base-200 card-actions">
            <div class="text-left">
              <div class="text-xs text-base-content/50 uppercase tracking-wide">Dining</div>
              <div class="font-semibold text-primary text-lg">Available</div>
            </div>
            <a href={`/${hotelSlug}/restaurant`} class="btn btn-accent btn-sm">
              View Menu
              <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
