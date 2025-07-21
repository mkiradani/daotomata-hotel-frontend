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

        {/* Enhanced Gradient Overlay */}
        <div class="absolute inset-0 bg-gradient-to-b from-neutral/20 via-neutral/40 to-neutral/60"></div>

        {/* Content with Enhanced Background */}
        <div class="z-10 relative mx-auto px-4 max-w-6xl text-center">
          <div class="backdrop-blur-sm bg-gradient-to-b from-base-100/10 via-base-100/5 to-transparent p-8 rounded-3xl border border-base-content/10">
            <h1 class="mb-6 font-primary text-base-content text-6xl drop-shadow-lg">
              {hotelName}
            </h1>
            <p class="mb-8 font-secondary text-lg text-base-content/90 drop-shadow-md">
              Welcome to an extraordinary experience
            </p>

            {/* Hero Booking Widget */}
            <div class="mb-8">
              <HeroBookingWidget hotelName={hotelName} />
            </div>

            {/* Language and Currency Selectors */}
            <div class="flex justify-center gap-4 mb-8">
              <select
                class="backdrop-blur-md bg-base-100/90 border border-base-content/20 select-bordered select h-12 min-h-12"
                style="background: linear-gradient(135deg, color-mix(in srgb, var(--color-base-100) 90%, transparent) 0%, color-mix(in srgb, var(--color-base-100) 85%, transparent) 100%); border-color: color-mix(in srgb, var(--color-base-content) 20%, transparent); border-radius: var(--radius-box, 0.5rem);"
              >
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

              <select
                class="backdrop-blur-md bg-base-100/90 border border-base-content/20 select-bordered select h-12 min-h-12"
                style="background: linear-gradient(135deg, color-mix(in srgb, var(--color-base-100) 90%, transparent) 0%, color-mix(in srgb, var(--color-base-100) 85%, transparent) 100%); border-color: color-mix(in srgb, var(--color-base-content) 20%, transparent); border-radius: var(--radius-box, 0.5rem);"
              >
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
              <button
                type="button"
                class="backdrop-blur-md bg-secondary/10 border border-secondary/30 hover:bg-secondary/20 btn btn-outline h-12 min-h-12 transition-all duration-300"
                style="border-radius: var(--radius-box, 0.5rem);"
              >
                Explore Rooms
              </button>
              <button
                type="button"
                class="backdrop-blur-md bg-secondary/10 border border-secondary/30 hover:bg-secondary/20 btn btn-outline h-12 min-h-12 transition-all duration-300"
                style="border-radius: var(--radius-box, 0.5rem);"
              >
                View Facilities
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Scroll indicator */}
        <div class="bottom-8 left-1/2 absolute -translate-x-1/2 animate-bounce transform">
          <div class="backdrop-blur-sm bg-base-100/20 border border-base-content/20 p-3 rounded-full">
            <svg
              class="w-6 h-6 text-base-content drop-shadow-md"
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
        </div>
      </section>
    );
  }
);
