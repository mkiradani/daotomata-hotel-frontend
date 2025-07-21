/** @jsxImportSource @builder.io/qwik */
import { component$ } from '@builder.io/qwik';
import { HeroBookingWidget } from './HeroBookingWidget';

interface HeroSectionProps {
  hotelName: string;
  heroImageUrl?: string;
  heroVideoUrl?: string;
  availableLanguages: string[];
  availableCurrencies: string[];
  currentLanguage: string;
  defaultCurrency: string;
}

export const HeroSection = component$<HeroSectionProps>(
  ({
    hotelName,
    heroImageUrl,
    heroVideoUrl,
    availableLanguages,
    availableCurrencies,
    currentLanguage,
    defaultCurrency,
  }) => {
    // No theme configuration needed - DaisyUI handles themes automatically

    return (
      <section class="relative flex justify-center items-center h-screen overflow-hidden">
        {/* Background Image - loads first */}
        {heroImageUrl && (
          <img
            src={heroImageUrl}
            alt={`${hotelName} Hero`}
            class="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Background Video - simplified approach */}
        {heroVideoUrl && (
          <video
            src={heroVideoUrl}
            class="absolute inset-0 w-full h-full object-cover"
            autoplay
            muted
            loop
            playsInline
            preload="metadata"
          />
        )}

        {/* Overlay */}
        <div class="absolute inset-0 bg-neutral opacity-40"></div>

        {/* Content */}
        <div class="z-10 relative mx-auto px-4 max-w-6xl text-neutral-content text-center">
          <h1 class="opacity-95 mb-6 font-primary text-neutral-content text-6xl">
            {hotelName}
          </h1>
          <p class="opacity-90 mb-8 font-secondary text-xl">
            Welcome to an extraordinary experience
          </p>

          {/* Hero Booking Widget */}
          <div class="mb-8">
            <HeroBookingWidget hotelName={hotelName} />
          </div>

          {/* Language and Currency Selectors */}
          <div class="flex justify-center gap-4 mb-8">
            <select class="bg-base-100 backdrop-blur-sm border-base-300 select-bordered select" style="background-color: color-mix(in srgb, var(--color-base-100) 80%, transparent); border-color: color-mix(in srgb, var(--color-base-300) 50%, transparent);">
              <option disabled selected>
                Language
              </option>
              {availableLanguages.map((lang) => (
                <option
                  key={lang}
                  value={lang}
                  selected={lang === currentLanguage}
                >
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>

            <select class="bg-base-100 backdrop-blur-sm border-base-300 select-bordered select" style="background-color: color-mix(in srgb, var(--color-base-100) 80%, transparent); border-color: color-mix(in srgb, var(--color-base-300) 50%, transparent);">
              <option disabled selected>
                Currency
              </option>
              {availableCurrencies.map((currency) => (
                <option
                  key={currency}
                  value={currency}
                  selected={currency === defaultCurrency}
                >
                  {currency.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Secondary Actions */}
          <div class="flex justify-center gap-4">
            <button type="button" class="btn-outline btn btn-secondary">
              Explore Rooms
            </button>
            <button type="button" class="btn-outline btn btn-secondary">
              View Facilities
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div class="bottom-8 left-1/2 absolute text-neutral-content -translate-x-1/2 animate-bounce transform">
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <title>Scroll down arrow</title>
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </section>
    );
  }
);
