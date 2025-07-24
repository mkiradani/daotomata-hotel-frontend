/** @jsxImportSource @builder.io/qwik */
import { component$ } from '@builder.io/qwik';
import { HeroBookingWidget } from './HeroBookingWidget';
import { getMediaUrl } from '../lib/directus.js';

interface LogoInfo {
  id: string;
  filename_disk: string;
  title?: string;
}

interface HeroSectionProps {
  hotelName: string;
  hotelLogo?: LogoInfo | null;
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
    hotelLogo,
    heroImageUrl,
    heroVideoUrl,
    availableLanguages: _availableLanguages,
    availableCurrencies: _availableCurrencies,
    currentLanguage: _currentLanguage,
    defaultCurrency: _defaultCurrency,
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
        <div class="z-10 relative flex flex-col justify-center items-center mx-auto px-4 max-w-6xl min-h-screen text-center">
          {/* Hero Title and Subtitle - Independent */}
          <div class="mb-8">
            {/* Hotel Logo */}
            {hotelLogo && hotelLogo.id && (
              <div class="flex justify-center mb-6">
                <img
                  src={
                    getMediaUrl(hotelLogo.id, { height: 80, quality: 90 }) || ''
                  }
                  alt={hotelLogo.title ?? hotelName}
                  class="drop-shadow-lg w-auto h-20"
                />
              </div>
            )}
            <h1 class="drop-shadow-lg mb-6 font-primary text-white text-6xl">
              {hotelName}
            </h1>
            <p class="drop-shadow-md mb-8 font-secondary text-white text-lg">
              Welcome to an extraordinary experience
            </p>
          </div>

          {/* Hero Booking Widget */}
          <HeroBookingWidget hotelName={hotelName} />
        </div>
      </section>
    );
  }
);
