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
          <div 
            class="backdrop-blur-sm p-8 border"
            style="background: linear-gradient(135deg, color-mix(in srgb, var(--color-base-100) 15%, transparent) 0%, transparent 100%); border: 1px solid color-mix(in srgb, var(--color-base-100) 20%, transparent); border-radius: var(--radius-box);"
          >
            <h1 class="mb-6 font-primary text-6xl drop-shadow-lg text-white">
              {hotelName}
            </h1>
            <p class="mb-8 font-secondary text-lg drop-shadow-md text-white">
              Welcome to an extraordinary experience
            </p>

            {/* Hero Booking Widget */}
            <div class="mb-8">
              <HeroBookingWidget hotelName={hotelName} />
            </div>

            {/* Language and Currency Selectors */}
            <div class="flex flex-wrap justify-center gap-4 mt-8">
              {/* Language Selector */}
              <div class="form-control">
                <select
                  class="select select-bordered w-full max-w-xs"
                  style="background: color-mix(in srgb, var(--color-base-100) 90%, transparent); border: 1px solid color-mix(in srgb, var(--color-base-100) 40%, transparent); border-radius: var(--radius-field); color: var(--color-base-content);"
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
              </div>

              {/* Currency Selector */}
              <div class="form-control">
                <select
                  class="select select-bordered w-full max-w-xs"
                  style="background: color-mix(in srgb, var(--color-base-100) 90%, transparent); border: 1px solid color-mix(in srgb, var(--color-base-100) 40%, transparent); border-radius: var(--radius-field); color: var(--color-base-content);"
                >
                  <option disabled selected>
                    {defaultCurrency}
                  </option>
                  {availableCurrencies.map((currency) => (
                    <option
                      key={currency}
                      value={currency}
                      selected={currency === defaultCurrency}
                    >
                      {currency}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div class="flex flex-wrap justify-center gap-4 mt-8">
              <button
                class="btn btn-outline"
                style="border: 1px solid color-mix(in srgb, var(--color-base-100) 60%, transparent); color: var(--color-base-100); border-radius: var(--radius-box);"
              >
                Explore Rooms
              </button>
              <button
                class="btn btn-outline"
                style="border: 1px solid color-mix(in srgb, var(--color-base-100) 60%, transparent); color: var(--color-base-100); border-radius: var(--radius-box);"
              >
                View Facilities
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }
);