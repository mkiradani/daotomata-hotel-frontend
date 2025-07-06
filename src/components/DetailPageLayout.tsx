/** @jsxImportSource @builder.io/qwik */
import { $, component$, useSignal } from "@builder.io/qwik";

interface DetailPageLayoutProps {
  // Basic content
  title: string;
  description: string;
  type: "room" | "facility" | "activity";

  // Media
  imageUrl: string;
  videoUrl?: string;
  galleryImages?: Array<{
    id: string;
    url: string;
    title?: string;
    type?: "image" | "video";
  }>;

  // Metadata based on actual Directus schema
  metadata: {
    // Room specific (from Directus rooms table)
    roomType?: string; // room_type
    maxOccupancy?: number; // max_occupancy
    sizeSqm?: number; // size_sqm
    bedConfiguration?: string; // bed_configuration
    viewType?: string; // view_type
    floorNumber?: number; // floor_number
    isAccessible?: boolean; // is_accessible
    amenities?: string[]; // amenities
    basePrice?: string; // base_price (will come from Cloudbeds)

    // Activity specific (from Directus activities table)
    category?: string; // category
    durationMinutes?: number; // duration_minutes
    maxParticipants?: number; // max_participants
    price?: string; // price
    location?: string; // location
    difficultyLevel?: string; // difficulty_level
    ageRestriction?: string; // age_restriction
    equipmentProvided?: string; // equipment_provided
    bookingRequired?: boolean; // booking_required

    // Facility specific (from Directus facilities table)
    facilityCategory?: string; // category
    facilityLocation?: string; // location
    capacity?: number; // capacity
    operatingHours?: string; // operating_hours (converted to string)
    facilityBookingRequired?: boolean; // booking_required
    pricePerHour?: string; // price_per_hour
    facilityAmenities?: string[]; // amenities
    facilityAgeRestriction?: string; // age_restriction
    dressCode?: string; // dress_code
    facilityIsAccessible?: boolean; // is_accessible
  };

  // Hotel context
  hotelName: string;
  hotelSlug: string;
  defaultCurrency: string;

  // Breadcrumb
  breadcrumbItems: Array<{
    label: string;
    href?: string;
  }>;

  // Future Cloudbeds integration
  availabilityData?: {
    isAvailable?: boolean;
    nextAvailableDate?: string;
    priceRange?: {
      min: number;
      max: number;
    };
  };
}

export const DetailPageLayout = component$<DetailPageLayoutProps>(
  ({
    title,
    description,
    type,
    imageUrl,
    videoUrl: _videoUrl,
    galleryImages = [],
    metadata,
    hotelName: _hotelName,
    hotelSlug: _hotelSlug,
    defaultCurrency,
    breadcrumbItems,
    availabilityData,
  }) => {
    const currentSlide = useSignal(0);
    const showBookingModal = useSignal(false);

    // Slideshow navigation functions
    const goToSlide = $((index: number) => {
      currentSlide.value = index;
    });

    const nextSlide = $(() => {
      currentSlide.value = (currentSlide.value + 1) % galleryImages.length;
    });

    const prevSlide = $(() => {
      currentSlide.value =
        currentSlide.value === 0
          ? galleryImages.length - 1
          : currentSlide.value - 1;
    });

    // Booking modal functions
    const openBookingModal = $(() => {
      showBookingModal.value = true;
    });

    const closeBookingModal = $(() => {
      showBookingModal.value = false;
    });

    // Helper function to render type-specific metadata
    const renderMetadata = () => {
      switch (type) {
        case "room":
          return (
            <div class="space-y-6">
              <div class="gap-4 grid grid-cols-2">
                <div class="bg-base-200 p-4 border border-base-300 rounded-lg">
                  <div class="mb-1 text-xs text-base-content/50 uppercase tracking-wide">
                    Room Type
                  </div>
                  <div class="font-semibold text-primary">
                    {metadata.roomType || "Standard"}
                  </div>
                </div>
                <div class="bg-base-200 p-4 border border-base-300 rounded-lg">
                  <div class="mb-1 text-xs text-base-content/50 uppercase tracking-wide">
                    Max Occupancy
                  </div>
                  <div class="font-semibold text-primary">
                    {metadata.maxOccupancy || 2} guests
                  </div>
                </div>
              </div>

              {metadata.sizeSqm && (
                <div class="bg-base-200 p-4 border border-base-300 rounded-lg">
                  <div class="mb-1 text-xs text-base-content/50 uppercase tracking-wide">
                    Room Size
                  </div>
                  <div class="font-semibold text-primary">
                    {metadata.sizeSqm} m²
                  </div>
                </div>
              )}

              {metadata.bedConfiguration && (
                <div class="bg-base-200 p-4 border border-base-300 rounded-lg">
                  <div class="mb-1 text-xs text-base-content/50 uppercase tracking-wide">
                    Bed Configuration
                  </div>
                  <div class="font-semibold text-primary">
                    {metadata.bedConfiguration}
                  </div>
                </div>
              )}

              {metadata.viewType && (
                <div class="bg-base-200 p-4 border border-base-300 rounded-lg">
                  <div class="mb-1 text-xs text-base-content/50 uppercase tracking-wide">
                    View
                  </div>
                  <div class="font-semibold text-primary">
                    {metadata.viewType}
                  </div>
                </div>
              )}

              {/* Cloudbeds pricing integration placeholder */}
              {(metadata.basePrice || availabilityData?.priceRange) && (
                <div class="bg-accent/10 p-6 border border-accent/20 rounded-lg">
                  <div class="mb-1 text-accent text-xs uppercase tracking-wide">
                    {availabilityData?.priceRange
                      ? "Price Range"
                      : "Starting From"}
                  </div>
                  <div class="font-bold text-accent text-3xl">
                    {availabilityData?.priceRange
                      ? `${availabilityData.priceRange.min} - ${availabilityData.priceRange.max} ${defaultCurrency}`
                      : `${metadata.basePrice} ${defaultCurrency}`}
                  </div>
                  <div class="mt-1 text-accent/70 text-xs">per night</div>
                  {availabilityData && !availabilityData.isAvailable && (
                    <div class="mt-2 text-warning text-xs">
                      Next available: {availabilityData.nextAvailableDate}
                    </div>
                  )}
                </div>
              )}

              {metadata.amenities && metadata.amenities.length > 0 && (
                <div>
                  <h3 class="mb-3 font-semibold text-lg">Amenities</h3>
                  <div class="flex flex-wrap gap-2">
                    {metadata.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        class="bg-primary/10 px-3 py-1 rounded-full text-primary text-sm"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {metadata.isAccessible && (
                <div class="bg-info/10 p-4 border border-info/20 rounded-lg">
                  <div class="font-semibold text-info">♿ Accessible Room</div>
                  <div class="mt-1 text-info/80 text-sm">
                    This room is wheelchair accessible
                  </div>
                </div>
              )}
            </div>
          );

        case "activity":
          return (
            <div class="space-y-6">
              <div class="gap-4 grid grid-cols-2">
                <div class="bg-base-200 p-4 border border-base-300 rounded-lg">
                  <div class="mb-1 text-xs text-base-content/50 uppercase tracking-wide">
                    Duration
                  </div>
                  <div class="font-semibold text-primary">
                    {metadata.durationMinutes
                      ? `${metadata.durationMinutes} min`
                      : "Varies"}
                  </div>
                </div>
                <div class="bg-base-200 p-4 border border-base-300 rounded-lg">
                  <div class="mb-1 text-xs text-base-content/50 uppercase tracking-wide">
                    Difficulty
                  </div>
                  <div class="font-semibold text-primary">
                    {metadata.difficultyLevel || "All levels"}
                  </div>
                </div>
              </div>

              {metadata.maxParticipants && (
                <div class="bg-base-200 p-4 border border-base-300 rounded-lg">
                  <div class="mb-1 text-xs text-base-content/50 uppercase tracking-wide">
                    Max Participants
                  </div>
                  <div class="font-semibold text-primary">
                    {metadata.maxParticipants} people
                  </div>
                </div>
              )}

              {metadata.location && (
                <div class="bg-base-200 p-4 border border-base-300 rounded-lg">
                  <div class="mb-1 text-xs text-base-content/50 uppercase tracking-wide">
                    Location
                  </div>
                  <div class="font-semibold text-primary">
                    {metadata.location}
                  </div>
                </div>
              )}

              {metadata.price && (
                <div class="bg-accent/10 p-6 border border-accent/20 rounded-lg">
                  <div class="mb-1 text-accent text-xs uppercase tracking-wide">
                    Price
                  </div>
                  <div class="font-bold text-accent text-3xl">
                    {metadata.price} {defaultCurrency}
                  </div>
                  <div class="mt-1 text-accent/70 text-xs">per person</div>
                </div>
              )}

              {metadata.equipmentProvided && (
                <div>
                  <h3 class="mb-3 font-semibold text-lg">Equipment Provided</h3>
                  <div class="text-sm text-base-content/80">
                    {metadata.equipmentProvided}
                  </div>
                </div>
              )}

              {metadata.ageRestriction && (
                <div class="bg-warning/10 p-4 border border-warning/20 rounded-lg">
                  <div class="font-semibold text-warning">Age Restriction</div>
                  <div class="mt-1 text-warning/80 text-sm">
                    {metadata.ageRestriction}
                  </div>
                </div>
              )}

              {metadata.bookingRequired && (
                <div class="bg-info/10 p-4 border border-info/20 rounded-lg">
                  <div class="font-semibold text-info">📅 Booking Required</div>
                  <div class="mt-1 text-info/80 text-sm">
                    Please reserve in advance
                  </div>
                </div>
              )}
            </div>
          );

        case "facility":
          return (
            <div class="space-y-6">
              <div class="gap-4 grid grid-cols-2">
                <div class="bg-base-200 p-4 border border-base-300 rounded-lg">
                  <div class="mb-1 text-xs text-base-content/50 uppercase tracking-wide">
                    Capacity
                  </div>
                  <div class="font-semibold text-primary">
                    {metadata.capacity
                      ? `${metadata.capacity} people`
                      : "Unlimited"}
                  </div>
                </div>
                <div class="bg-base-200 p-4 border border-base-300 rounded-lg">
                  <div class="mb-1 text-xs text-base-content/50 uppercase tracking-wide">
                    Category
                  </div>
                  <div class="font-semibold text-primary">
                    {metadata.facilityCategory || "General"}
                  </div>
                </div>
              </div>

              {metadata.facilityLocation && (
                <div class="bg-base-200 p-4 border border-base-300 rounded-lg">
                  <div class="mb-1 text-xs text-base-content/50 uppercase tracking-wide">
                    Location
                  </div>
                  <div class="font-semibold text-primary">
                    {metadata.facilityLocation}
                  </div>
                </div>
              )}

              {metadata.operatingHours && (
                <div class="bg-base-200 p-4 border border-base-300 rounded-lg">
                  <div class="mb-1 text-xs text-base-content/50 uppercase tracking-wide">
                    Operating Hours
                  </div>
                  <div class="font-semibold text-primary">
                    {metadata.operatingHours}
                  </div>
                </div>
              )}

              {metadata.pricePerHour && (
                <div class="bg-accent/10 p-6 border border-accent/20 rounded-lg">
                  <div class="mb-1 text-accent text-xs uppercase tracking-wide">
                    Price
                  </div>
                  <div class="font-bold text-accent text-3xl">
                    {metadata.pricePerHour} {defaultCurrency}
                  </div>
                  <div class="mt-1 text-accent/70 text-xs">per hour</div>
                </div>
              )}

              {metadata.facilityAmenities &&
                metadata.facilityAmenities.length > 0 && (
                  <div>
                    <h3 class="mb-3 font-semibold text-lg">Amenities</h3>
                    <div class="flex flex-wrap gap-2">
                      {metadata.facilityAmenities.map((amenity) => (
                        <span
                          key={amenity}
                          class="bg-primary/10 px-3 py-1 rounded-full text-primary text-sm"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {metadata.dressCode && (
                <div class="bg-warning/10 p-4 border border-warning/20 rounded-lg">
                  <div class="font-semibold text-warning">👔 Dress Code</div>
                  <div class="mt-1 text-warning/80 text-sm">
                    {metadata.dressCode}
                  </div>
                </div>
              )}

              {metadata.facilityBookingRequired && (
                <div class="bg-info/10 p-4 border border-info/20 rounded-lg">
                  <div class="font-semibold text-info">📅 Booking Required</div>
                  <div class="mt-1 text-info/80 text-sm">
                    Please contact reception to reserve
                  </div>
                </div>
              )}

              {metadata.facilityIsAccessible && (
                <div class="bg-info/10 p-4 border border-info/20 rounded-lg">
                  <div class="font-semibold text-info">
                    ♿ Accessible Facility
                  </div>
                  <div class="mt-1 text-info/80 text-sm">
                    This facility is wheelchair accessible
                  </div>
                </div>
              )}
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div class="min-h-screen">
        {/* Breadcrumb */}
        <nav class="bg-base-200/50 px-4 py-3">
          <div class="mx-auto max-w-7xl">
            <div class="flex items-center space-x-2 text-sm">
              {breadcrumbItems.map((item, index) => (
                <div key={`${item.label}-${index}`} class="flex items-center">
                  {index > 0 && (
                    <span class="mx-2 text-base-content/50">/</span>
                  )}
                  {item.href ? (
                    <a
                      href={item.href}
                      class="text-primary hover:text-primary-focus transition-colors"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <span class="text-base-content/70">{item.label}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section class="relative h-96 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            class="absolute inset-0 w-full h-full object-cover"
          />
          <div class="absolute inset-0 bg-neutral/40"></div>
          <div class="z-10 relative flex items-end h-full">
            <div class="mx-auto px-4 pb-12 w-full max-w-7xl">
              <h1 class="mb-4 font-primary font-bold text-neutral-content text-5xl">
                {title}
              </h1>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section class="px-4 py-12">
          <div class="mx-auto max-w-7xl">
            <div class="gap-12 grid grid-cols-1 lg:grid-cols-3">
              {/* Main Content */}
              <div class="space-y-8 lg:col-span-2">
                <div>
                  <h2 class="mb-6 font-primary font-bold text-3xl">
                    About This {type.charAt(0).toUpperCase() + type.slice(1)}
                  </h2>
                  <div class="font-secondary text-base-content/80 text-lg leading-relaxed">
                    {description}
                  </div>
                </div>

                {/* Gallery */}
                {galleryImages.length > 0 && (
                  <div>
                    <h3 class="mb-6 font-primary font-bold text-2xl">
                      Gallery
                    </h3>

                    {/* Custom Slideshow without scroll */}
                    <div class="relative bg-base-200 mb-4 rounded-lg w-full aspect-[16/10] overflow-hidden">
                      {galleryImages.map((media, index) => (
                        <div
                          key={`slide-${media.id}-${index}`}
                          class={`absolute inset-0 w-full h-full ${
                            index === currentSlide.value ? "block" : "hidden"
                          }`}
                        >
                          {media.type === "video" ? (
                            <video
                              src={media.url}
                              class="w-full h-full object-cover"
                              controls
                              preload="metadata"
                            >
                              <track
                                kind="captions"
                                src=""
                                label="No captions available"
                                default
                              />
                            </video>
                          ) : (
                            <img
                              src={media.url}
                              alt={media.title || `Gallery image ${index + 1}`}
                              class="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      ))}

                      {/* Navigation Arrows */}
                      {galleryImages.length > 1 && (
                        <div class="top-1/2 right-5 left-5 absolute flex justify-between -translate-y-1/2 transform">
                          <button
                            type="button"
                            onClick$={prevSlide}
                            class="bg-neutral/50 hover:bg-neutral/70 border-none text-neutral-content btn btn-circle btn-sm"
                          >
                            ❮
                          </button>
                          <button
                            type="button"
                            onClick$={nextSlide}
                            class="bg-neutral/50 hover:bg-neutral/70 border-none text-neutral-content btn btn-circle btn-sm"
                          >
                            ❯
                          </button>
                        </div>
                      )}

                      {/* Counter */}
                      <div class="top-4 right-4 absolute bg-neutral/70 px-3 py-1 rounded text-neutral-content text-sm">
                        {currentSlide.value + 1} / {galleryImages.length}
                      </div>
                    </div>

                    {/* Thumbnail Navigation */}
                    <div class="flex gap-2 pb-2 overflow-x-auto">
                      {galleryImages.map((media, index) => (
                        <button
                          type="button"
                          key={`thumb-${media.id}-${index}`}
                          onClick$={() => goToSlide(index)}
                          class={`relative flex-shrink-0 bg-base-200 border-2 w-20 h-16 overflow-hidden transition-colors ${
                            index === currentSlide.value
                              ? "border-primary"
                              : "border-transparent hover:border-primary"
                          }`}
                        >
                          {media.type === "video" ? (
                            <video
                              src={media.url}
                              class="w-full h-full object-cover"
                              muted
                              preload="metadata"
                            />
                          ) : (
                            <img
                              src={media.url}
                              alt={media.title || `Thumbnail ${index + 1}`}
                              class="w-full h-full object-cover"
                            />
                          )}
                          {media.type === "video" && (
                            <div class="absolute inset-0 flex justify-center items-center bg-neutral/30">
                              <svg
                                class="w-4 h-4 text-neutral-content"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <title>Play video icon</title>
                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div class="space-y-8">
                {renderMetadata()}

                {/* Action Buttons */}
                <div class="space-y-4">
                  <button
                    type="button"
                    class="w-full btn btn-primary btn-lg"
                    onClick$={openBookingModal}
                  >
                    {type === "room"
                      ? "Check Availability"
                      : type === "activity"
                        ? "Reserve Activity"
                        : "Book Facility"}
                  </button>
                  <button type="button" class="btn-outline w-full btn">
                    Contact Reception
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Booking Modal */}
        {showBookingModal.value && (
          <div class="modal modal-open">
            <div class="max-w-4xl modal-box">
              <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold text-lg">
                  {type === "room"
                    ? `Book ${title}`
                    : type === "activity"
                      ? `Reserve ${title}`
                      : `Book ${title}`}
                </h3>
                <button
                  type="button"
                  class="btn btn-sm btn-circle btn-ghost"
                  onClick$={closeBookingModal}
                >
                  ✕
                </button>
              </div>

              <div class="bg-base-200 mb-4 p-4 rounded-lg">
                <div class="flex justify-between items-center">
                  <div>
                    <h4 class="font-semibold">{title}</h4>
                    <p class="opacity-70 text-sm">
                      {type === "room" &&
                        metadata.roomType &&
                        `${metadata.roomType} • Max ${metadata.maxOccupancy} guests`}
                      {type === "activity" &&
                        metadata.category &&
                        `${metadata.category} • ${metadata.durationMinutes} minutes`}
                      {type === "facility" &&
                        metadata.facilityCategory &&
                        `${metadata.facilityCategory} • Capacity: ${metadata.capacity}`}
                    </p>
                  </div>
                  <div class="text-right">
                    {(metadata.basePrice ||
                      metadata.price ||
                      metadata.pricePerHour) && (
                      <div class="font-bold text-primary text-2xl">
                        {defaultCurrency}{" "}
                        {metadata.basePrice ||
                          metadata.price ||
                          metadata.pricePerHour}
                      </div>
                    )}
                    <p class="opacity-70 text-sm">
                      {type === "room"
                        ? "per night"
                        : type === "facility"
                          ? "per hour"
                          : "per person"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Booking form would go here */}
              <div class="py-8 text-center">
                <p class="mb-4 text-lg">Booking functionality coming soon!</p>
                <p class="opacity-70 mb-6 text-sm">
                  We're implementing the full booking system with Cloudbeds
                  integration.
                </p>
                <div class="flex justify-center gap-2">
                  <button
                    type="button"
                    class="btn btn-primary"
                    onClick$={closeBookingModal}
                  >
                    Contact Reception
                  </button>
                  <button
                    type="button"
                    class="btn-outline btn"
                    onClick$={closeBookingModal}
                  >
                    Close
                  </button>
                </div>
              </div>

              <div class="modal-action">
                <button type="button" class="btn" onClick$={closeBookingModal}>
                  Close
                </button>
              </div>
            </div>
            <div class="modal-backdrop" onClick$={closeBookingModal}></div>
          </div>
        )}
      </div>
    );
  },
);
