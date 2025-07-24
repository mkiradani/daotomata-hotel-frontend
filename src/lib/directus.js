import { createDirectus, readItems, rest, staticToken } from '@directus/sdk';
import fetch from 'node-fetch';
import { DEFAULT_SERVICES } from './constants.js';

// Create Directus client with admin token for build-time access
const directusUrl =
  import.meta.env.DIRECTUS_URL || DEFAULT_SERVICES.directusUrl;
const directusToken = import.meta.env.DIRECTUS_ADMIN_TOKEN;

// Create Directus client with proper configuration for Node.js/Astro using node-fetch polyfill
const directus = createDirectus(directusUrl, {
  globals: {
    fetch: fetch,
  },
})
  .with(
    rest({
      // Configure for Node.js compatibility and CORS
      credentials: 'include',
      onRequest: (options) => {
        // Ensure proper headers and configuration for Node.js requests
        return {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Daotomata-Hotel-Frontend/1.0',
            ...options.headers,
          },
          // Disable cache for fresh data
          cache: 'no-store',
        };
      },
    })
  )
  .with(staticToken(directusToken));

// Export the directus client for direct use
export { directus };

/**
 * Get current hotel ID from environment variables
 */
export function getCurrentHotelId() {
  return import.meta.env.HOTEL_ID || process.env.HOTEL_ID || '1';
}

/**
 * Get all hotels for static path generation (DEPRECATED - not needed for single-tenant)
 */
export async function getAllHotels() {
  console.warn(
    '⚠️ getAllHotels() is deprecated in single-tenant mode. Use getCurrentHotel() instead.'
  );
  try {
    const hotels = await directus.request(
      readItems('hotels', {
        fields: [
          'id',
          'name',
          'domain',
          'status',
          'avaliable_currencies',
          'avaliable_lenguages',
          'pms_type',
          'cloudbeds_client_id',
          'cloudbeds_client_secret',
          'cloudbeds_api_key',
          'cloudbeds_property_id',
          'cloudbeds_booking_url_id',
        ],
        filter: {
          status: {
            _in: ['published', 'draft'], // Include both published and draft hotels
          },
        },
      })
    );

    console.log(
      `✅ Found ${hotels.length} hotels:`,
      hotels.map((h) => h.domain)
    );
    return hotels;
  } catch (error) {
    console.error('❌ Error fetching hotels:', error);
    return [];
  }
}

/**
 * Get complete hotel data by ID with all related content
 */
export async function getHotelById(hotelId) {
  try {
    // First get the hotel
    const hotels = await directus.request(
      readItems('hotels', {
        filter: {
          id: {
            _eq: hotelId,
          },
        },
        fields: [
          'id',
          'name',
          'domain',
          'status',
          'pms_type',
          'avaliable_currencies',
          'avaliable_lenguages',
          'cloudbeds_client_id',
          'cloudbeds_client_secret',
          'cloudbeds_api_key',
          'cloudbeds_property_id',
          'cloudbeds_booking_url_id',
          'chatwoot_website_token',
          'ga4_token',
          'meta_pixel_token',
          'location',
          'theme',
          'logo.id',
          'logo.filename_disk',
          'logo.title',
        ],
        limit: 1,
      })
    );

    if (!hotels || hotels.length === 0) {
      return null;
    }

    const hotel = hotels[0];

    // Load related data separately for better control
    const [
      rooms,
      activities,
      facilities,
      galleries,
      heroMedia,
      restaurant,
      dishes,
    ] = await Promise.all([
      // Rooms - Updated fields for new structure
      directus.request(
        readItems('rooms', {
          filter: { hotel_id: { _eq: hotel.id } },
          fields: [
            'id',
            'name',
            'description',
            'cloudbeds_room_id', // Changed from pms_room_id
            'bed_configuration',
            'size_sqm',
            'amenities',
            'is_accesible', // Note: typo in new schema (accesible vs accessible)
            'main_photo.id',
            'main_photo.filename_disk',
            'main_photo.title',
            'main_video.id',
            'main_video.filename_disk',
            'main_video.title',
            'media_gallery.directus_files_id.id',
            'media_gallery.directus_files_id.filename_disk',
            'media_gallery.directus_files_id.title',
            'media_gallery.directus_files_id.type',
          ],
        })
      ),
      // Activities - Updated fields for new structure
      directus.request(
        readItems('activities', {
          filter: { hotel_id: { _eq: hotel.id } },
          fields: [
            'id',
            'name',
            'description',
            'max_participants',
            'age_restriction',
            'equipment_provided',
            'booking_requiered', // Note: typo in new schema (requiered vs required)
            'operating_hours',
            'main_photo.id',
            'main_photo.filename_disk',
            'main_photo.title',
            'main_video.id',
            'main_video.filename_disk',
            'main_video.title',
            'media_gallery.directus_files_id.id',
            'media_gallery.directus_files_id.filename_disk',
            'media_gallery.directus_files_id.title',
            'media_gallery.directus_files_id.type',
          ],
        })
      ),
      // Facilities - Updated fields for new structure
      directus.request(
        readItems('facilities', {
          filter: { hotel_id: { _eq: hotel.id } },
          fields: [
            'id',
            'name',
            'description',
            'capacity',
            'operating_hours',
            'booking_requiered', // Note: typo in new schema (requiered vs required)
            'price', // Changed from price_per_hour
            'amenities',
            'age_restriction',
            'is_accessible',
            'main_photo.id',
            'main_photo.filename_disk',
            'main_photo.title',
            'main_video.id',
            'main_video.filename_disk',
            'main_video.title',
            'media_gallery.directus_files_id.id',
            'media_gallery.directus_files_id.filename_disk',
            'media_gallery.directus_files_id.title',
            'media_gallery.directus_files_id.type',
          ],
        })
      ),
      // Galleries - Updated fields for new structure
      directus.request(
        readItems('galleries', {
          filter: { hotel_id: { _eq: hotel.id } },
          fields: [
            'id',
            'name', // Changed from title to name
            'description',
            'main_photo.id',
            'main_photo.filename_disk',
            'main_photo.title',
            'media_gallery.directus_files_id.id',
            'media_gallery.directus_files_id.filename_disk',
            'media_gallery.directus_files_id.title',
            'media_gallery.directus_files_id.type',
          ],
        })
      ),
      // Hero Media
      directus.request(
        readItems('hero_media', {
          filter: { hotel_id: { _eq: hotel.id } },
          fields: [
            'main_photo.id',
            'main_photo.filename_disk',
            'main_photo.title',
            'main_video.id',
            'main_video.filename_disk',
            'main_video.title',
          ],
        })
      ),
      // Restaurant - New collection
      directus.request(
        readItems('restaurant', {
          filter: { hotel_id: { _eq: hotel.id } },
          fields: [
            'id',
            'name',
            'description',
            'main_photo.id',
            'main_photo.filename_disk',
            'main_photo.title',
            'main_video.id',
            'main_video.filename_disk',
            'main_video.title',
          ],
        })
      ),
      // Dishes - New collection
      directus.request(
        readItems('dishes', {
          filter: { hotel_id: { _eq: hotel.id } },
          fields: [
            'id',
            'name',
            'description',
            'ingredients',
            'dietary_options',
            'calories',
            'allergens',
            'is_available',
            'price',
            'is_featured',
            'main_photo.id',
            'main_photo.filename_disk',
            'main_photo.title',
          ],
        })
      ),
    ]);

    // Combine all data
    return {
      ...hotel,
      rooms: rooms || [],
      activities: activities || [],
      facilities: facilities || [],
      galleries: galleries || [],
      hero_media: heroMedia || [],
      restaurant: restaurant && restaurant.length > 0 ? restaurant[0] : null,
      dishes: dishes || [],
    };
  } catch (error) {
    console.error('❌ Error fetching hotel by ID:', error);
    return null;
  }
}

/**
 * Get complete hotel data with all related content (DEPRECATED - use getHotelById)
 */
export async function getHotelByDomain(domain) {
  console.warn(
    '⚠️ getHotelByDomain() is deprecated in single-tenant mode. Use getCurrentHotel() instead.'
  );

  // For backward compatibility, try to find hotel by domain
  try {
    const hotels = await directus.request(
      readItems('hotels', {
        filter: { domain: { _eq: domain } },
        fields: ['id'],
        limit: 1,
      })
    );

    if (hotels && hotels.length > 0) {
      return await getHotelById(hotels[0].id);
    }

    return null;
  } catch (error) {
    console.error('❌ Error fetching hotel by domain:', error);
    return null;
  }
}

/**
 * Get current hotel data based on HOTEL_ID environment variable
 */
export async function getCurrentHotel() {
  const hotelId = getCurrentHotelId();
  console.log(`🏨 Loading current hotel with ID: ${hotelId}`);
  return await getHotelById(hotelId);
}

/**
 * Get media gallery files for a collection item
 */
export async function getMediaGallery(collection, itemId) {
  try {
    const junctionTable = `${collection}_files`;
    const files = await directus.request(
      readItems(junctionTable, {
        filter: {
          [`${collection}_id`]: {
            _eq: itemId,
          },
        },
        fields: [
          'directus_files_id.id',
          'directus_files_id.filename_disk',
          'directus_files_id.title',
          'directus_files_id.type',
          'directus_files_id.filesize',
        ],
      })
    );

    return files?.map((file) => file.directus_files_id) || [];
  } catch (error) {
    console.error(`❌ Error fetching media gallery for ${collection}:`, error);
    return [];
  }
}

/**
 * Get restaurant data for a hotel
 */
export async function getRestaurantByHotelId(hotelId) {
  try {
    const restaurants = await directus.request(
      readItems('restaurant', {
        filter: { hotel_id: { _eq: hotelId } },
        fields: [
          'id',
          'name',
          'description',
          'main_photo.id',
          'main_photo.filename_disk',
          'main_photo.title',
          'main_video.id',
          'main_video.filename_disk',
          'main_video.title',
        ],
      })
    );
    return restaurants?.[0] || null;
  } catch (error) {
    console.error('❌ Error fetching restaurant:', error);
    return null;
  }
}

/**
 * Get dishes for a hotel
 */
export async function getDishesByHotelId(hotelId) {
  try {
    const dishes = await directus.request(
      readItems('dishes', {
        filter: {
          hotel_id: { _eq: hotelId },
          is_available: { _eq: true },
        },
        fields: [
          'id',
          'name',
          'description',
          'ingredients',
          'dietary_options',
          'calories',
          'allergens',
          'is_available',
          'main_photo.id',
          'main_photo.filename_disk',
          'main_photo.title',
        ],
      })
    );
    return dishes || [];
  } catch (error) {
    console.error('❌ Error fetching dishes:', error);
    return [];
  }
}

/**
 * Get AI knowledge base for a hotel
 */
export async function getAIKnowledgeByHotelId(hotelId) {
  try {
    const knowledge = await directus.request(
      readItems('ai_knowledge', {
        filter: { hotel_id: { _eq: hotelId } },
        fields: ['id', 'title', 'content'],
      })
    );
    return knowledge || [];
  } catch (error) {
    console.error('❌ Error fetching AI knowledge:', error);
    return [];
  }
}

/**
 * Generate media URL for Directus files with access token
 */
export function getMediaUrl(fileId, options = {}) {
  if (!fileId) {
    return null;
  }

  const { width, height, quality = 80, format } = options;
  const url = `${directusUrl}/assets/${fileId}`;

  // Build query parameters manually to avoid URLSearchParams issues in build context
  const params = [];

  // Add access token for public access to files
  params.push(`access_token=${directusToken}`);

  if (width) params.push(`width=${width}`);
  if (height) params.push(`height=${height}`);
  if (quality !== 80) params.push(`quality=${quality}`);
  if (format) params.push(`format=${format}`);

  const queryString = params.join('&');
  const finalUrl = `${url}?${queryString}`;

  return finalUrl;
}

/**
 * Process media gallery from Directus with automatic type detection
 * DRY utility function to avoid code duplication across detail pages
 */
export function processMediaGallery(
  mediaGallery,
  fallbackTitle = 'Gallery Item'
) {
  if (!mediaGallery || !Array.isArray(mediaGallery)) {
    return [];
  }

  return mediaGallery
    .map((media) => {
      // Handle the structure from Directus: media_gallery.directus_files_id
      const fileData = media.directus_files_id;
      if (!fileData) {
        return null;
      }

      const fileId = fileData.id;
      const fileTitle = fileData.title || fallbackTitle;
      const mimeType = fileData.type || '';

      // Automatically detect type based on MIME type
      const isVideo = mimeType.startsWith('video/');

      // Generate URL with appropriate options
      const urlOptions = isVideo
        ? {} // Videos don't need resize options
        : { width: 1200, height: 675, quality: 95 }; // Images get optimized

      return {
        id: fileId,
        url: getMediaUrl(fileId, urlOptions) || '',
        title: fileTitle,
        type: isVideo ? 'video' : 'image', // Ensure correct literal type
      };
    })
    .filter(Boolean); // Remove any null entries
}

/**
 * Get translated content based on language preference
 */
export function getTranslatedContent(
  item,
  language = 'en-US',
  fallbackLanguage = 'en-US'
) {
  if (!item || !item.translations) return item;

  // Find translation for preferred language
  const translation = item.translations.find(
    (t) => t.languages_id === language
  );

  // If not found, try fallback language
  const fallbackTranslation =
    translation ||
    item.translations.find((t) => t.languages_id === fallbackLanguage) ||
    item.translations[0]; // Use first available translation

  // Merge translation with original item
  if (fallbackTranslation) {
    return {
      ...item,
      ...fallbackTranslation,
      translations: item.translations, // Keep original translations array
    };
  }

  return item;
}

/**
 * Get contact methods for a hotel
 */
export async function getContactMethodsByHotelId(hotelId) {
  try {
    const contactMethods = await directus.request(
      readItems('contact_methods', {
        filter: { hotel_id: { _eq: hotelId } },
        fields: ['id', 'contact_type', 'contact_identifier', 'name'],
      })
    );
    return contactMethods || [];
  } catch (error) {
    console.error('❌ Error fetching contact methods:', error);
    return [];
  }
}

/**
 * Get hotel info for a hotel
 */
export async function getHotelInfoByHotelId(hotelId) {
  try {
    const hotelInfo = await directus.request(
      readItems('hotel_info', {
        filter: { hotel_id: { _eq: hotelId } },
        fields: [
          'id',
          'location',
          'logo.id',
          'logo.filename_disk',
          'logo.title',
        ],
      })
    );
    return hotelInfo?.[0] || null;
  } catch (error) {
    console.error('❌ Error fetching hotel info:', error);
    return null;
  }
}

/**
 * Get social profiles for a hotel
 */
export async function getSocialProfilesByHotelId(hotelId) {
  try {
    const socialProfiles = await directus.request(
      readItems('social_profiles', {
        filter: { hotel_id: { _eq: hotelId } },
        fields: ['id', 'social_platform', 'social_url'],
      })
    );
    return socialProfiles || [];
  } catch (error) {
    console.error('❌ Error fetching social profiles:', error);
    return [];
  }
}

/**
 * Get guest services for a hotel
 */
export async function getGuestServicesByHotelId(hotelId) {
  try {
    const guestServices = await directus.request(
      readItems('guest_services', {
        filter: { hotel_id: { _eq: hotelId } },
        fields: [
          'id',
          'name',
          'description',
          'service_category',
          'operating_hours',
          'is_available',
          'price',
          'booking_required',
          'main_photo.id',
          'main_photo.filename_disk',
          'main_photo.title',
        ],
      })
    );
    return guestServices || [];
  } catch (error) {
    console.error('❌ Error fetching guest services:', error);
    return [];
  }
}

/**
 * Get local places for a hotel, optionally filtered by category
 */
export async function getLocalPlacesByHotelId(hotelId, category = null) {
  try {
    const filter = { hotel_id: { _eq: hotelId } };
    if (category) {
      filter.category = { _eq: category };
    }

    const localPlaces = await directus.request(
      readItems('local_places', {
        filter,
        fields: [
          'id',
          'name',
          'description',
          'category',
          'address',
          'coordinates',
          'distance_from_hotel',
          'contact_phone',
          'contact_website',
          'contact_email',
          'opening_hours',
          'price_range',
          'tags',
          'main_photo.id',
          'main_photo.filename_disk',
          'main_photo.title',
        ],
        sort: ['distance_from_hotel', 'name'],
      })
    );
    return localPlaces || [];
  } catch (error) {
    console.error('❌ Error fetching local places:', error);
    return [];
  }
}

/**
 * Get transportation options for a hotel
 */
export async function getTransportationByHotelId(hotelId) {
  try {
    const transportation = await directus.request(
      readItems('transportation', {
        filter: { hotel_id: { _eq: hotelId } },
        fields: [
          'id',
          'name',
          'description',
          'transport_type',
          'estimated_cost',
          'travel_time_to_downtown',
          'travel_time_to_airport',
          'operating_hours',
          'booking_required',
          'pickup_location',
          'main_photo.id',
          'main_photo.filename_disk',
          'main_photo.title',
          'contact_method.contact_methods_id.contact_type',
          'contact_method.contact_methods_id.contact_identifier',
          'contact_method.contact_methods_id.name',
        ],
      })
    );
    return transportation || [];
  } catch (error) {
    console.error('❌ Error fetching transportation:', error);
    return [];
  }
}

/**
 * Mock data for Baberrih Hotel guest directory
 */
const getMockGuestDirectoryData = (hotelId) => {
  // Only provide mock data for Baberrih Hotel (ID: 2)
  if (hotelId !== '2') {
    return null;
  }

  return {
    guestServices: [
      {
        id: 'concierge',
        name: 'Concierge Service',
        description:
          'Our experienced concierge team is available 24/7 to assist with recommendations, reservations, and local arrangements.',
        service_category: 'concierge',
        operating_hours: {
          mon: { open: '00:00', close: '23:59' },
          tue: { open: '00:00', close: '23:59' },
          wed: { open: '00:00', close: '23:59' },
          thu: { open: '00:00', close: '23:59' },
          fri: { open: '00:00', close: '23:59' },
          sat: { open: '00:00', close: '23:59' },
          sun: { open: '00:00', close: '23:59' },
        },
        is_available: true,
        price: 'Complimentary',
        booking_required: false,
        main_photo: null,
      },
      {
        id: 'housekeeping',
        name: 'Housekeeping Service',
        description:
          'Daily housekeeping service and special requests to ensure your comfort throughout your stay.',
        service_category: 'housekeeping',
        operating_hours: {
          mon: { open: '09:00', close: '17:00' },
          tue: { open: '09:00', close: '17:00' },
          wed: { open: '09:00', close: '17:00' },
          thu: { open: '09:00', close: '17:00' },
          fri: { open: '09:00', close: '17:00' },
          sat: { open: '09:00', close: '17:00' },
          sun: { open: '09:00', close: '17:00' },
        },
        is_available: true,
        price: 'Included',
        booking_required: false,
        main_photo: null,
      },
      {
        id: 'laundry',
        name: 'Laundry & Dry Cleaning',
        description:
          'Professional laundry and dry cleaning services with same-day or next-day delivery.',
        service_category: 'housekeeping',
        operating_hours: {
          mon: { open: '08:00', close: '18:00' },
          tue: { open: '08:00', close: '18:00' },
          wed: { open: '08:00', close: '18:00' },
          thu: { open: '08:00', close: '18:00' },
          fri: { open: '08:00', close: '18:00' },
          sat: { open: '08:00', close: '16:00' },
          sun: { open: '10:00', close: '16:00' },
        },
        is_available: true,
        price: 'Extra charge applies',
        booking_required: false,
        main_photo: null,
      },
    ],
    localPlaces: [
      {
        id: 'essaouira-medina',
        name: 'Essaouira Medina',
        description:
          'UNESCO World Heritage site featuring traditional Moroccan architecture, souks, and artisan workshops.',
        category: 'culture',
        address: 'Medina, Essaouira, Morocco',
        coordinates: null,
        distance_from_hotel: 2500,
        contact_phone: null,
        contact_website: null,
        contact_email: null,
        opening_hours: {
          mon: { open: '08:00', close: '20:00' },
          tue: { open: '08:00', close: '20:00' },
          wed: { open: '08:00', close: '20:00' },
          thu: { open: '08:00', close: '20:00' },
          fri: { open: '08:00', close: '20:00' },
          sat: { open: '08:00', close: '20:00' },
          sun: { open: '08:00', close: '20:00' },
        },
        price_range: 'free',
        tags: ['historic', 'unesco', 'shopping', 'culture'],
        main_photo: null,
      },
      {
        id: 'skala-kasbah',
        name: 'Skala de la Kasbah',
        description:
          'Historic sea bastion with cannons and panoramic views of the Atlantic Ocean and city walls.',
        category: 'viewpoints',
        address: 'Place Moulay Hassan, Essaouira, Morocco',
        coordinates: null,
        distance_from_hotel: 2800,
        contact_phone: null,
        contact_website: null,
        contact_email: null,
        opening_hours: {
          mon: { open: '09:00', close: '18:00' },
          tue: { open: '09:00', close: '18:00' },
          wed: { open: '09:00', close: '18:00' },
          thu: { open: '09:00', close: '18:00' },
          fri: { open: '09:00', close: '18:00' },
          sat: { open: '09:00', close: '18:00' },
          sun: { open: '09:00', close: '18:00' },
        },
        price_range: 'budget',
        tags: ['historic', 'views', 'photography', 'sunset'],
        main_photo: null,
      },
      {
        id: 'essaouira-beach',
        name: 'Essaouira Beach',
        description:
          'Wide sandy beach perfect for walks, water sports, and watching local fishermen and surfers.',
        category: 'nature',
        address: 'Essaouira Beach, Morocco',
        coordinates: null,
        distance_from_hotel: 1800,
        contact_phone: null,
        contact_website: null,
        contact_email: null,
        opening_hours: null,
        price_range: 'free',
        tags: ['beach', 'surfing', 'walking', 'sunset'],
        main_photo: null,
      },
      {
        id: 'port-essaouira',
        name: 'Port of Essaouira',
        description:
          'Working fishing port where you can watch the daily catch being brought in and buy fresh seafood.',
        category: 'culture',
        address: "Port d'Essaouira, Morocco",
        coordinates: null,
        distance_from_hotel: 2200,
        contact_phone: null,
        contact_website: null,
        contact_email: null,
        opening_hours: {
          mon: { open: '06:00', close: '19:00' },
          tue: { open: '06:00', close: '19:00' },
          wed: { open: '06:00', close: '19:00' },
          thu: { open: '06:00', close: '19:00' },
          fri: { open: '06:00', close: '19:00' },
          sat: { open: '06:00', close: '19:00' },
          sun: { open: '06:00', close: '19:00' },
        },
        price_range: 'free',
        tags: ['fishing', 'local-life', 'seafood', 'authentic'],
        main_photo: null,
      },
      {
        id: 'taros-cafe',
        name: 'Taros Café Restaurant',
        description:
          'Popular rooftop restaurant and bar with panoramic views over the medina and ocean.',
        category: 'food_and_drink',
        address: '2 Rue de la Skala, Essaouira, Morocco',
        coordinates: null,
        distance_from_hotel: 2600,
        contact_phone: '+212 524-47-64-07',
        contact_website: 'https://www.taroscafe.com',
        contact_email: null,
        opening_hours: {
          mon: { open: '10:00', close: '01:00' },
          tue: { open: '10:00', close: '01:00' },
          wed: { open: '10:00', close: '01:00' },
          thu: { open: '10:00', close: '01:00' },
          fri: { open: '10:00', close: '01:00' },
          sat: { open: '10:00', close: '01:00' },
          sun: { open: '10:00', close: '01:00' },
        },
        price_range: 'moderate',
        tags: ['rooftop', 'views', 'international', 'bar'],
        main_photo: null,
      },
      {
        id: 'cooperative-argan',
        name: 'Cooperative Amal Argan',
        description:
          "Women's cooperative producing traditional argan oil. Watch the production process and purchase authentic products.",
        category: 'shopping',
        address: "Route d'Agadir, Essaouira, Morocco",
        coordinates: null,
        distance_from_hotel: 5000,
        contact_phone: '+212 524-78-40-46',
        contact_website: null,
        contact_email: null,
        opening_hours: {
          mon: { open: '08:00', close: '18:00' },
          tue: { open: '08:00', close: '18:00' },
          wed: { open: '08:00', close: '18:00' },
          thu: { open: '08:00', close: '18:00' },
          fri: { open: '08:00', close: '18:00' },
          sat: { open: '08:00', close: '17:00' },
          sun: { open: '09:00', close: '17:00' },
        },
        price_range: 'budget',
        tags: ['cooperative', 'argan-oil', 'women-owned', 'authentic'],
        main_photo: null,
      },
    ],
    transportation: [
      {
        id: 'grand-taxi',
        name: 'Grand Taxi Service',
        description:
          'Shared or private taxi service connecting Essaouira to major cities like Marrakech and Casablanca.',
        transport_type: 'taxi',
        estimated_cost: '200-400 MAD to Marrakech',
        travel_time_to_downtown: 15,
        travel_time_to_airport: 20,
        operating_hours: {
          mon: { open: '06:00', close: '22:00' },
          tue: { open: '06:00', close: '22:00' },
          wed: { open: '06:00', close: '22:00' },
          thu: { open: '06:00', close: '22:00' },
          fri: { open: '06:00', close: '22:00' },
          sat: { open: '06:00', close: '22:00' },
          sun: { open: '07:00', close: '21:00' },
        },
        booking_required: false,
        pickup_location: 'Hotel pickup available',
        main_photo: null,
        contact_method: [],
      },
      {
        id: 'local-taxi',
        name: 'Petit Taxi (Local)',
        description:
          'Local taxis for short trips within Essaouira city. Metered service for convenient urban transport.',
        transport_type: 'taxi',
        estimated_cost: '10-30 MAD within city',
        travel_time_to_downtown: 8,
        travel_time_to_airport: 15,
        operating_hours: {
          mon: { open: '06:00', close: '01:00' },
          tue: { open: '06:00', close: '01:00' },
          wed: { open: '06:00', close: '01:00' },
          thu: { open: '06:00', close: '01:00' },
          fri: { open: '06:00', close: '01:00' },
          sat: { open: '06:00', close: '01:00' },
          sun: { open: '06:00', close: '01:00' },
        },
        booking_required: false,
        pickup_location: 'Street hail or hotel call',
        main_photo: null,
        contact_method: [],
      },
      {
        id: 'car-rental',
        name: 'Car Rental Services',
        description:
          'Rent a car to explore the region at your own pace. Several agencies available in the city center.',
        transport_type: 'rental',
        estimated_cost: '300-600 MAD per day',
        travel_time_to_downtown: 10,
        travel_time_to_airport: 18,
        operating_hours: {
          mon: { open: '08:00', close: '19:00' },
          tue: { open: '08:00', close: '19:00' },
          wed: { open: '08:00', close: '19:00' },
          thu: { open: '08:00', close: '19:00' },
          fri: { open: '08:00', close: '19:00' },
          sat: { open: '08:00', close: '18:00' },
          sun: { open: '09:00', close: '17:00' },
        },
        booking_required: true,
        pickup_location: 'Hotel delivery available',
        main_photo: null,
        contact_method: [],
      },
      {
        id: 'bus-ctm',
        name: 'CTM Bus Service',
        description:
          'Comfortable bus service to major Moroccan cities including Marrakech, Casablanca, and Rabat.',
        transport_type: 'bus',
        estimated_cost: '80-150 MAD to Marrakech',
        travel_time_to_downtown: 20,
        travel_time_to_airport: 25,
        operating_hours: {
          mon: { open: '07:00', close: '20:00' },
          tue: { open: '07:00', close: '20:00' },
          wed: { open: '07:00', close: '20:00' },
          thu: { open: '07:00', close: '20:00' },
          fri: { open: '07:00', close: '20:00' },
          sat: { open: '07:00', close: '20:00' },
          sun: { open: '08:00', close: '19:00' },
        },
        booking_required: true,
        pickup_location: "CTM Bus Station, Avenue de l'Istiqlal",
        main_photo: null,
        contact_method: [],
      },
      {
        id: 'bicycle-rental',
        name: 'Bicycle Rental',
        description:
          'Explore Essaouira and the surrounding countryside on two wheels. Perfect for the flat coastal terrain.',
        transport_type: 'rental',
        estimated_cost: '80-120 MAD per day',
        travel_time_to_downtown: 12,
        travel_time_to_airport: null,
        operating_hours: {
          mon: { open: '09:00', close: '18:00' },
          tue: { open: '09:00', close: '18:00' },
          wed: { open: '09:00', close: '18:00' },
          thu: { open: '09:00', close: '18:00' },
          fri: { open: '09:00', close: '18:00' },
          sat: { open: '09:00', close: '18:00' },
          sun: { open: '10:00', close: '17:00' },
        },
        booking_required: false,
        pickup_location: 'Various rental shops in medina',
        main_photo: null,
        contact_method: [],
      },
    ],
  };
};

/**
 * Get all guest directory data for a hotel in one call
 */
export async function getGuestDirectoryByHotelId(hotelId) {
  try {
    const [
      guestServices,
      localPlaces,
      transportation,
      restaurant,
      dishes,
      facilities,
      activities,
    ] = await Promise.all([
      getGuestServicesByHotelId(hotelId),
      getLocalPlacesByHotelId(hotelId),
      getTransportationByHotelId(hotelId),
      getRestaurantByHotelId(hotelId),
      getDishesByHotelId(hotelId),
      // Get facilities and activities for hotel services section
      directus.request(
        readItems('facilities', {
          filter: { hotel_id: { _eq: hotelId } },
          fields: [
            'id',
            'name',
            'description',
            'operating_hours',
            'booking_requiered',
            'is_accessible',
            'main_photo.id',
            'main_photo.filename_disk',
            'main_photo.title',
          ],
        })
      ),
      directus.request(
        readItems('activities', {
          filter: { hotel_id: { _eq: hotelId } },
          fields: [
            'id',
            'name',
            'description',
            'operating_hours',
            'booking_requiered',
            'equipment_provided',
            'main_photo.id',
            'main_photo.filename_disk',
            'main_photo.title',
          ],
        })
      ),
    ]);

    // Get mock data for empty collections (only for Baberrih Hotel)
    const mockData = getMockGuestDirectoryData(hotelId);

    const result = {
      guestServices:
        guestServices.length > 0
          ? guestServices
          : mockData?.guestServices || [],
      localPlaces:
        localPlaces.length > 0 ? localPlaces : mockData?.localPlaces || [],
      transportation:
        transportation.length > 0
          ? transportation
          : mockData?.transportation || [],
      dining: {
        restaurant: restaurant,
        dishes: dishes || [],
        localDining:
          localPlaces.length > 0
            ? localPlaces.filter((place) => place.category === 'food_and_drink')
            : mockData?.localPlaces.filter(
                (place) => place.category === 'food_and_drink'
              ) || [],
      },
      hotelServices: {
        facilities: facilities || [],
        activities: activities || [],
        guestServices:
          guestServices.length > 0
            ? guestServices
            : mockData?.guestServices || [],
      },
    };

    console.log(`🔍 [DEBUG] Mock data applied for hotel ${hotelId}:`, {
      mockGuestServices: mockData?.guestServices?.length || 0,
      mockLocalPlaces: mockData?.localPlaces?.length || 0,
      mockTransportation: mockData?.transportation?.length || 0,
      resultGuestServices: result.guestServices.length,
      resultLocalPlaces: result.localPlaces.length,
      resultTransportation: result.transportation.length,
    });

    return result;
  } catch (error) {
    console.error('❌ Error fetching guest directory data:', error);
    return {
      guestServices: [],
      localPlaces: [],
      transportation: [],
      dining: { restaurant: null, dishes: [], localDining: [] },
      hotelServices: { facilities: [], activities: [], guestServices: [] },
    };
  }
}
