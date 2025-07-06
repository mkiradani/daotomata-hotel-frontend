/** @jsxImportSource @builder.io/qwik */
import { component$ } from "@builder.io/qwik";

interface SocialProfile {
  id: number;
  social_platform: string;
  social_url: string;
}

interface HotelInfo {
  id: number;
  location: string;
  logo?: {
    id: string;
    filename_disk: string;
    title: string;
  };
}

interface FooterProps {
  hotelName: string;
  hotelSlug: string;
  contactEmail?: string;
  contactPhoneCalls?: string;
  contactPhoneMessages?: string;
  location?: {
    type: string;
    coordinates: [number, number];
  };
  socialProfiles?: SocialProfile[];
  hotelInfo?: HotelInfo;
}

export const Footer = component$<FooterProps>(
  ({
    hotelName,
    hotelSlug,
    contactEmail,
    contactPhoneCalls,
    contactPhoneMessages,
    location,
    socialProfiles = [],
    hotelInfo,
  }) => {
    const currentYear = new Date().getFullYear();

    // Helper function to format location coordinates to a readable address
    const getLocationText = () => {
      // Prefer detailed location from hotel_info if available
      if (hotelInfo?.location) {
        return hotelInfo.location;
      }

      // Fallback to coordinates if available
      if (location?.coordinates) {
        const [lng, lat] = location.coordinates;
        // For demo purposes, we'll show coordinates. In production, you might want to reverse geocode
        return `${lat.toFixed(4)}°N, ${Math.abs(lng).toFixed(4)}°W`;
      }

      return "Location not available";
    };

    // Helper function to get social media icon SVG
    const getSocialIcon = (platform: string) => {
      switch (platform.toLowerCase()) {
        case "instagram":
          return (
            <svg
              class="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="Instagram"
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          );
        case "facebook":
          return (
            <svg
              class="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="Facebook"
            >
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          );
        case "x":
        case "twitter":
          return (
            <svg
              class="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="X (Twitter)"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          );
        case "youtube":
          return (
            <svg
              class="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="YouTube"
            >
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          );
        case "tiktok":
          return (
            <svg
              class="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="TikTok"
            >
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
            </svg>
          );
        default:
          return (
            <svg
              class="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="Social media"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          );
      }
    };

    return (
      <footer class="bg-base-200 px-4 py-12 border-t border-base-300">
        <div class="mx-auto max-w-7xl container">
          <div class="gap-8 grid grid-cols-1 md:grid-cols-4">
            {/* Hotel Info */}
            <div class="md:col-span-2">
              <h3 class="mb-4 font-primary font-bold text-primary text-xl">
                {hotelName}
              </h3>
              <p class="mb-4 text-base-content/80 leading-relaxed">
                Experience luxury and comfort at {hotelName}. We provide
                exceptional hospitality with modern amenities and thoughtful
                service.
              </p>
              {/* Dynamic Social Media Links */}
              {socialProfiles && socialProfiles.length > 0 && (
                <div class="flex space-x-4">
                  {socialProfiles.map((profile) => (
                    <a
                      key={profile.id}
                      href={profile.social_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="hover:text-primary text-base-content/60 transition-colors"
                      title={`Follow us on ${profile.social_platform}`}
                    >
                      {getSocialIcon(profile.social_platform)}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div>
              <h4 class="mb-4 font-primary font-semibold text-base-content text-lg">
                Quick Links
              </h4>
              <ul class="space-y-2">
                <li>
                  <a
                    href={`/${hotelSlug}`}
                    class="hover:text-primary text-base-content/70 transition-colors"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href={`/${hotelSlug}/accommodation`}
                    class="hover:text-primary text-base-content/70 transition-colors"
                  >
                    Accommodation
                  </a>
                </li>
                <li>
                  <a
                    href={`/${hotelSlug}/facilities`}
                    class="hover:text-primary text-base-content/70 transition-colors"
                  >
                    Facilities
                  </a>
                </li>
                <li>
                  <a
                    href={`/${hotelSlug}/experiences`}
                    class="hover:text-primary text-base-content/70 transition-colors"
                  >
                    Experiences
                  </a>
                </li>
                <li>
                  <a
                    href={`/${hotelSlug}/restaurant`}
                    class="hover:text-primary text-base-content/70 transition-colors"
                  >
                    Restaurant
                  </a>
                </li>
                <li>
                  <a
                    href={`/${hotelSlug}/contact`}
                    class="hover:text-primary text-base-content/70 transition-colors"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href={`/${hotelSlug}/book`}
                    class="hover:text-primary text-base-content/70 transition-colors"
                  >
                    Book Now
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 class="mb-4 font-primary font-semibold text-base-content text-lg">
                Contact
              </h4>
              <div class="space-y-3">
                {/* Location */}
                <div class="flex items-center space-x-2">
                  <svg
                    class="w-4 h-4 text-base-content/60"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="Location"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <span class="text-sm text-base-content/70">
                    {getLocationText()}
                  </span>
                </div>

                {/* Phone Calls */}
                {contactPhoneCalls && (
                  <div class="flex items-center space-x-2">
                    <svg
                      class="w-4 h-4 text-base-content/60"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      role="img"
                      aria-label="Phone"
                    >
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                    </svg>
                    <span class="text-sm text-base-content/70">
                      {contactPhoneCalls}
                    </span>
                  </div>
                )}

                {/* Phone Messages */}
                {contactPhoneMessages && (
                  <div class="flex items-center space-x-2">
                    <svg
                      class="w-4 h-4 text-base-content/60"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      role="img"
                      aria-label="Messages"
                    >
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                    </svg>
                    <span class="text-sm text-base-content/70">
                      {contactPhoneMessages}
                    </span>
                  </div>
                )}

                {/* Email */}
                <div class="flex items-center space-x-2">
                  <svg
                    class="w-4 h-4 text-base-content/60"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="Email"
                  >
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                  <span class="text-sm text-base-content/70">
                    {contactEmail || `info@${hotelSlug}.com`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div class="flex md:flex-row flex-col justify-between items-center mt-8 pt-8 border-t border-base-300">
            <p class="text-sm text-base-content/60">
              © {currentYear} {hotelName}. All rights reserved.
            </p>
            <div class="flex space-x-6 mt-4 md:mt-0">
              <a
                href="/privacy"
                class="hover:text-primary text-sm text-base-content/60 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                class="hover:text-primary text-sm text-base-content/60 transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="/cookies"
                class="hover:text-primary text-sm text-base-content/60 transition-colors"
              >
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    );
  },
);
