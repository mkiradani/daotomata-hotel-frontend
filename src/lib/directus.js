import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';

// Create Directus client with admin token for build-time access
const directusUrl = import.meta.env.DIRECTUS_URL || 'http://localhost:8055';
const directusToken = import.meta.env.DIRECTUS_ADMIN_TOKEN || 'admin-token';

const directus = createDirectus(directusUrl).with(rest()).with(staticToken(directusToken));

/**
 * Get all hotels for static path generation
 */
export async function getAllHotels() {
  try {
    const hotels = await directus.request(
      readItems('hotels', {
        fields: [
          'id',
          'name',
          'domain',
          'default_language',
          'default_currency',
          'available_languages',
          'available_currencies',
        ],
      }),
    );
    return hotels;
  } catch (error) {
    console.error('❌ Error fetching hotels:', error);
    return [];
  }
}

/**
 * Get complete hotel data with all related content
 */
export async function getHotelByDomain(domain) {
  try {
    // First get the hotel
    const hotels = await directus.request(
      readItems('hotels', {
        filter: {
          domain: {
            _eq: domain,
          },
        },
        fields: [
          'id',
          'name',
          'domain',
          'pms_type',
          'default_language',
          'default_currency',
          'available_languages',
          'available_currencies',
          'cloudbeds_client_id',
          'cloudbeds_client_secret',
          'cloudbeds_api_key',
          'cloudbeds_property_id',
        ],
        limit: 1,
      }),
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
      themes,
      analytics,
      chatwootAccounts,
      heroMedia,
    ] = await Promise.all([
      // Rooms
      directus.request(
        readItems('rooms', {
          filter: { hotel_id: { _eq: hotel.id } },
          fields: [
            'id',
            'name',
            'description',
            'pms_room_id',
            'max_occupancy',
            'room_type',
            'bed_configuration',
            'size_sqm',
            'amenities',
            'view_type',
            'floor_number',
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
        }),
      ),
      // Activities
      directus.request(
        readItems('activities', {
          filter: { hotel_id: { _eq: hotel.id } },
          fields: [
            'id',
            'name',
            'description',
            'category',
            'duration_minutes',
            'max_participants',
            'price',
            'location',
            'difficulty_level',
            'age_restriction',
            'equipment_provided',
            'booking_required',
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
        }),
      ),
      // Facilities
      directus.request(
        readItems('facilities', {
          filter: { hotel_id: { _eq: hotel.id } },
          fields: [
            'id',
            'name',
            'description',
            'category',
            'location',
            'capacity',
            'operating_hours',
            'booking_required',
            'price_per_hour',
            'amenities',
            'age_restriction',
            'dress_code',
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
        }),
      ),
      // Galleries
      directus.request(
        readItems('galleries', {
          filter: { hotel_id: { _eq: hotel.id } },
          fields: [
            'id',
            'title',
            'description',
            'category',
            'is_featured',
            'tags',
            'sort_order',
            'main_photo.id',
            'main_photo.filename_disk',
            'main_photo.title',
          ],
        }),
      ),
      // Themes
      directus.request(
        readItems('themes', {
          filter: { hotel_id: { _eq: hotel.id } },
          fields: [
            'id',
            'name',
            'description',
            'config',
            'is_default',
            'logo.id',
            'logo.filename_disk',
            'logo.title',
          ],
        }),
      ),
      // Analytics
      directus.request(
        readItems('analytics', {
          filter: { hotel_id: { _eq: hotel.id } },
          fields: ['ga4_id', 'pixel_id'],
        }),
      ),
      // Chatwoot Accounts
      directus.request(
        readItems('chatwoot_accounts', {
          filter: { hotel_id: { _eq: hotel.id } },
          fields: ['account_id', 'website_token'],
        }),
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
        }),
      ),
    ]);

    // Combine all data
    return {
      ...hotel,
      rooms: rooms || [],
      activities: activities || [],
      facilities: facilities || [],
      galleries: galleries || [],
      themes: themes || [],
      analytics: analytics?.[0] || null,
      chatwoot_accounts: chatwootAccounts || [],
      hero_media: heroMedia || [],
    };
  } catch (error) {
    console.error('❌ Error fetching hotel by domain:', error);
    return null;
  }
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
      }),
    );

    return files?.map((file) => file.directus_files_id) || [];
  } catch (error) {
    console.error(`❌ Error fetching media gallery for ${collection}:`, error);
    return [];
  }
}

/**
 * Generate media URL for Directus files
 */
export function getMediaUrl(fileId, options = {}) {
  if (!fileId) return null;

  const { width, height, quality = 80, format } = options;
  const url = `${directusUrl}/assets/${fileId}`;

  // Build query parameters manually to avoid URLSearchParams issues in build context
  const params = [];
  if (width) params.push(`width=${width}`);
  if (height) params.push(`height=${height}`);
  if (quality !== 80) params.push(`quality=${quality}`);
  if (format) params.push(`format=${format}`);

  const queryString = params.join('&');
  return queryString ? `${url}?${queryString}` : url;
}

/**
 * Get translated content based on language preference
 */
export function getTranslatedContent(item, language = 'en-US', fallbackLanguage = 'en-US') {
  if (!item || !item.translations) return item;

  // Find translation for preferred language
  const translation = item.translations.find((t) => t.languages_id === language);

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
