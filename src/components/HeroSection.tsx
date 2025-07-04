/** @jsxImportSource @builder.io/qwik */
import { component$ } from '@builder.io/qwik';

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
    themeConfig = {},
  }) => {
    // Extract theme configuration
    const _colors = themeConfig?.colors || {};
    const _typography = themeConfig?.typography || {};
    const _layout = themeConfig?.layout || {};
    // For now, we'll use a simpler approach without useVisibleTask$
    // The video will load immediately but with lower priority

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
        <div class="absolute inset-0 bg-black/40"></div>

        {/* Content */}
        <div class="z-10 relative mx-auto px-4 max-w-4xl text-white text-center">
          <h1 class="mb-6 font-head font-bold text-6xl">{hotelName}</h1>
          <p class="opacity-90 mb-8 font-detail text-xl">Welcome to an extraordinary experience</p>

          {/* Language & Currency Selector */}
          <div class="flex justify-center gap-4 mb-8">
            <select class="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-white">
              {availableLanguages.map((lang) => (
                <option value={lang} selected={lang === currentLanguage}>
                  {lang.split('-')[0].toUpperCase()}
                </option>
              ))}
            </select>
            <select class="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-white">
              {availableCurrencies.map((currency) => (
                <option value={currency} selected={currency === defaultCurrency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>

          <div class="flex justify-center gap-4">
            <button type="button" class="text-lg btn btn-primary">
              Book Now
            </button>
            <button type="button" class="btn btn-secondary">
              Explore
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div class="bottom-8 left-1/2 absolute text-white -translate-x-1/2 animate-bounce transform">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
