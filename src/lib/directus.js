import { createDirectus, readItems, rest, staticToken } from "@directus/sdk";
import fetch from "node-fetch";

// Create Directus client with admin token for build-time access
const directusUrl =
  import.meta.env.DIRECTUS_URL || "https://hotels.daotomata.io";
const directusToken =
  import.meta.env.DIRECTUS_ADMIN_TOKEN || "rYncRSsu41KQQLvZYczPJyC8-8yzyED3";

// Create Directus client with proper configuration for Node.js/Astro using node-fetch polyfill
const directus = createDirectus(directusUrl, {
  globals: {
    fetch: fetch,
  },
})
  .with(
    rest({
      // Configure for Node.js compatibility and CORS
      credentials: "include",
      onRequest: (options) => {
        // Ensure proper headers and configuration for Node.js requests
        return {
          ...options,
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Daotomata-Hotel-Frontend/1.0",
            ...options.headers,
          },
          // Disable cache for fresh data
          cache: "no-store",
        };
      },
    }),
  )
  .with(staticToken(directusToken));

/**
 * Get all hotels for static path generation
 */
export async function getAllHotels() {
  try {
    const hotels = await directus.request(
      readItems("hotels", {
        fields: [
          "id",
          "name",
          "domain",
          "status",
          "avaliable_currencies",
          "avaliable_lenguages",
          "pms_type",
          "cloudbeds_client_id",
          "cloudbeds_client_secret",
          "cloudbeds_api_key",
          "cloudbeds_property_id",
        ],
        filter: {
          status: {
            _in: ["published", "draft"], // Include both published and draft hotels
          },
        },
      }),
    );

    console.log(
      `✅ Found ${hotels.length} hotels:`,
      hotels.map((h) => h.domain),
    );
    return hotels;
  } catch (error) {
    console.error("❌ Error fetching hotels:", error);
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
      readItems("hotels", {
        filter: {
          domain: {
            _eq: domain,
          },
        },
        fields: [
          "id",
          "name",
          "domain",
          "status",
          "pms_type",
          "avaliable_currencies",
          "avaliable_lenguages",
          "cloudbeds_client_id",
          "cloudbeds_client_secret",
          "cloudbeds_api_key",
          "cloudbeds_property_id",
          "chatwoot_website_token",
          "ga4_token",
          "meta_pixel_token",
          "location",
          "theme",
          "logo.id",
          "logo.filename_disk",
          "logo.title",
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
      heroMedia,
      restaurant,
      dishes,
    ] = await Promise.all([
      // Rooms - Updated fields for new structure
      directus.request(
        readItems("rooms", {
          filter: { hotel_id: { _eq: hotel.id } },
          fields: [
            "id",
            "name",
            "description",
            "cloudbeds_room_id", // Changed from pms_room_id
            "bed_configuration",
            "size_sqm",
            "amenities",
            "is_accesible", // Note: typo in new schema (accesible vs accessible)
            "main_photo.id",
            "main_photo.filename_disk",
            "main_photo.title",
            "main_video.id",
            "main_video.filename_disk",
            "main_video.title",
            "media_gallery.directus_files_id.id",
            "media_gallery.directus_files_id.filename_disk",
            "media_gallery.directus_files_id.title",
            "media_gallery.directus_files_id.type",
          ],
        }),
      ),
      // Activities - Updated fields for new structure
      directus.request(
        readItems("activities", {
          filter: { hotel_id: { _eq: hotel.id } },
          fields: [
            "id",
            "name",
            "description",
            "max_participants",
            "age_restriction",
            "equipment_provided",
            "booking_requiered", // Note: typo in new schema (requiered vs required)
            "operating_hours",
            "main_photo.id",
            "main_photo.filename_disk",
            "main_photo.title",
            "main_video.id",
            "main_video.filename_disk",
            "main_video.title",
            "media_gallery.directus_files_id.id",
            "media_gallery.directus_files_id.filename_disk",
            "media_gallery.directus_files_id.title",
            "media_gallery.directus_files_id.type",
          ],
        }),
      ),
      // Facilities - Updated fields for new structure
      directus.request(
        readItems("facilities", {
          filter: { hotel_id: { _eq: hotel.id } },
          fields: [
            "id",
            "name",
            "description",
            "capacity",
            "operating_hours",
            "booking_requiered", // Note: typo in new schema (requiered vs required)
            "price", // Changed from price_per_hour
            "amenities",
            "age_restriction",
            "is_accessible",
            "main_photo.id",
            "main_photo.filename_disk",
            "main_photo.title",
            "main_video.id",
            "main_video.filename_disk",
            "main_video.title",
            "media_gallery.directus_files_id.id",
            "media_gallery.directus_files_id.filename_disk",
            "media_gallery.directus_files_id.title",
            "media_gallery.directus_files_id.type",
          ],
        }),
      ),
      // Galleries - Updated fields for new structure
      directus.request(
        readItems("galleries", {
          filter: { hotel_id: { _eq: hotel.id } },
          fields: [
            "id",
            "name", // Changed from title to name
            "description",
            "main_photo.id",
            "main_photo.filename_disk",
            "main_photo.title",
            "media_gallery.directus_files_id.id",
            "media_gallery.directus_files_id.filename_disk",
            "media_gallery.directus_files_id.title",
            "media_gallery.directus_files_id.type",
          ],
        }),
      ),
      // Hero Media
      directus.request(
        readItems("hero_media", {
          filter: { hotel_id: { _eq: hotel.id } },
          fields: [
            "main_photo.id",
            "main_photo.filename_disk",
            "main_photo.title",
            "main_video.id",
            "main_video.filename_disk",
            "main_video.title",
          ],
        }),
      ),
      // Restaurant - New collection
      directus.request(
        readItems("restaurant", {
          filter: { hotel_id: { _eq: hotel.id } },
          fields: [
            "id",
            "name",
            "description",
            "main_photo.id",
            "main_photo.filename_disk",
            "main_photo.title",
            "main_video.id",
            "main_video.filename_disk",
            "main_video.title",
          ],
        }),
      ),
      // Dishes - New collection
      directus.request(
        readItems("dishes", {
          filter: { hotel_id: { _eq: hotel.id } },
          fields: [
            "id",
            "name",
            "description",
            "ingredients",
            "dietary_options",
            "calories",
            "allergens",
            "is_available",
            "price",
            "is_featured",
            "main_photo.id",
            "main_photo.filename_disk",
            "main_photo.title",
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
      hero_media: heroMedia || [],
      restaurant: restaurant && restaurant.length > 0 ? restaurant[0] : null,
      dishes: dishes || [],
    };
  } catch (error) {
    console.error("❌ Error fetching hotel by domain:", error);
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
          "directus_files_id.id",
          "directus_files_id.filename_disk",
          "directus_files_id.title",
          "directus_files_id.type",
          "directus_files_id.filesize",
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
 * Get restaurant data for a hotel
 */
export async function getRestaurantByHotelId(hotelId) {
  try {
    const restaurants = await directus.request(
      readItems("restaurant", {
        filter: { hotel_id: { _eq: hotelId } },
        fields: [
          "id",
          "name",
          "description",
          "main_photo.id",
          "main_photo.filename_disk",
          "main_photo.title",
          "main_video.id",
          "main_video.filename_disk",
          "main_video.title",
        ],
      }),
    );
    return restaurants?.[0] || null;
  } catch (error) {
    console.error("❌ Error fetching restaurant:", error);
    return null;
  }
}

/**
 * Get dishes for a hotel
 */
export async function getDishesByHotelId(hotelId) {
  try {
    const dishes = await directus.request(
      readItems("dishes", {
        filter: {
          hotel_id: { _eq: hotelId },
          is_available: { _eq: true },
        },
        fields: [
          "id",
          "name",
          "description",
          "ingredients",
          "dietary_options",
          "calories",
          "allergens",
          "is_available",
          "main_photo.id",
          "main_photo.filename_disk",
          "main_photo.title",
        ],
      }),
    );
    return dishes || [];
  } catch (error) {
    console.error("❌ Error fetching dishes:", error);
    return [];
  }
}

/**
 * Get AI knowledge base for a hotel
 */
export async function getAIKnowledgeByHotelId(hotelId) {
  try {
    const knowledge = await directus.request(
      readItems("ai_knowledge", {
        filter: { hotel_id: { _eq: hotelId } },
        fields: ["id", "title", "content"],
      }),
    );
    return knowledge || [];
  } catch (error) {
    console.error("❌ Error fetching AI knowledge:", error);
    return [];
  }
}

/**
 * Generate media URL for Directus files with access token
 */
export function getMediaUrl(fileId, options = {}) {
  console.log("🖼️ getMediaUrl called with:", {
    fileId,
    options,
    type: typeof fileId,
  });

  if (!fileId) {
    console.log("🖼️ getMediaUrl: No fileId provided, returning null");
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

  const queryString = params.join("&");
  const finalUrl = `${url}?${queryString}`;

  console.log("🖼️ getMediaUrl generated with token:", finalUrl);
  return finalUrl;
}

/**
 * Get translated content based on language preference
 */
export function getTranslatedContent(
  item,
  language = "en-US",
  fallbackLanguage = "en-US",
) {
  if (!item || !item.translations) return item;

  // Find translation for preferred language
  const translation = item.translations.find(
    (t) => t.languages_id === language,
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
      readItems("contact_methods", {
        filter: { hotel_id: { _eq: hotelId } },
        fields: ["id", "contact_type", "contact_identifier", "name"],
      }),
    );
    return contactMethods || [];
  } catch (error) {
    console.error("❌ Error fetching contact methods:", error);
    return [];
  }
}

/**
 * Get hotel info for a hotel
 */
export async function getHotelInfoByHotelId(hotelId) {
  try {
    const hotelInfo = await directus.request(
      readItems("hotel_info", {
        filter: { hotel_id: { _eq: hotelId } },
        fields: [
          "id",
          "location",
          "logo.id",
          "logo.filename_disk",
          "logo.title",
        ],
      }),
    );
    return hotelInfo?.[0] || null;
  } catch (error) {
    console.error("❌ Error fetching hotel info:", error);
    return null;
  }
}

/**
 * Get social profiles for a hotel
 */
export async function getSocialProfilesByHotelId(hotelId) {
  try {
    const socialProfiles = await directus.request(
      readItems("social_profiles", {
        filter: { hotel_id: { _eq: hotelId } },
        fields: ["id", "social_platform", "social_url"],
      }),
    );
    return socialProfiles || [];
  } catch (error) {
    console.error("❌ Error fetching social profiles:", error);
    return [];
  }
}
