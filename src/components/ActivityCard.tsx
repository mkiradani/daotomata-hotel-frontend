/** @jsxImportSource @builder.io/qwik */
import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';

interface ActivityCardProps {
  name: string;
  description: string;
  category: string;
  durationMinutes?: number;
  difficultyLevel?: string;
  price?: string;
  defaultCurrency: string;
  imageUrl: string;
  videoUrl?: string;
  isLast: boolean;
  isOdd: boolean;
  hotelSlug: string;
  activitySlug: string;
}

export const ActivityCard = component$<ActivityCardProps>(({
  name,
  description,
  category,
  durationMinutes,
  difficultyLevel,
  price,
  defaultCurrency,
  imageUrl,
  videoUrl,
  isLast,
  isOdd,
  hotelSlug,
  activitySlug
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
            <div class="bg-secondary/80 backdrop-blur-sm border border-secondary-content/20 font-semibold badge badge-secondary badge-lg">
              {category}
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
          {durationMinutes && (
            <div class="badge-outline badge badge-sm">
              <svg class="mr-1 w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
              </svg>
              {durationMinutes} min
            </div>
          )}
          {difficultyLevel && (
            <div class="badge-outline badge badge-sm">
              <svg class="mr-1 w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              {difficultyLevel}
            </div>
          )}
        </div>

        <div class="justify-between items-center pt-4 border-t border-base-200 card-actions">
          <div class="text-left">
            <div class="text-xs text-base-content/50 uppercase tracking-wide">Price</div>
            <div class="font-bold text-primary text-2xl">
              {price ? `${defaultCurrency} ${price}` : 'Free'}
            </div>
          </div>
          <a href={`/${hotelSlug}/activities/${activitySlug}`} class="btn btn-secondary btn-sm">
            Learn More
            <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
});
