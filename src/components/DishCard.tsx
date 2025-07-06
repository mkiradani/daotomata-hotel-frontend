/** @jsxImportSource @builder.io/qwik */
import { component$ } from "@builder.io/qwik";

interface DishCardProps {
  name: string;
  description: string;
  price: number;
  ingredients?: string[];
  dietary_options?: string[];
  allergens?: string[];
  calories?: number;
  imageUrl: string;
  isAvailable: boolean;
  defaultCurrency: string;
  isLast?: boolean;
  isOdd?: boolean;
}

export const DishCard = component$<DishCardProps>(
  ({
    name,
    description,
    price,
    ingredients,
    dietary_options,
    allergens,
    calories,
    imageUrl,
    isAvailable,
    defaultCurrency,
    isLast = false,
    isOdd = false,
  }) => {
    // Format price based on currency
    const formatPrice = (price: number, currency: string) => {
      if (currency === "EUR") return `€${price}`;
      if (currency === "USD") return `$${price}`;
      if (currency === "MAD") return `${price} DH`;
      return `${price} ${currency}`;
    };

    const formatDietaryOption = (option: string) => {
      return option.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    };

    const formatAllergen = (allergen: string) => {
      return allergen
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
    };

    return (
      <div
        class={`
          bg-base-100 border-2 border-base-300 hover:border-primary transition-all duration-300 card overflow-hidden
          ${!isAvailable ? "opacity-60" : ""}
          ${isLast && isOdd ? "md:col-span-2" : ""}
        `}
      >
        {imageUrl && (
          <figure class="relative overflow-hidden">
            <img
              src={imageUrl}
              alt={name}
              class="w-full object-cover aspect-video transition-opacity duration-300"
              loading="lazy"
            />
            {!isAvailable && (
              <div class="top-4 left-4 z-10 absolute">
                <div class="bg-error/90 backdrop-blur-sm px-3 py-1 rounded-full font-semibold text-error-content text-sm">
                  Not Available
                </div>
              </div>
            )}
          </figure>
        )}

        <div class="p-6 card-body">
          <h3 class="mb-3 font-primary text-primary text-xl card-title">
            {name}
          </h3>

          <p class="mb-4 text-sm text-base-content/70 line-clamp-3 leading-relaxed">
            {description}
          </p>

          <div class="flex flex-wrap gap-4 mb-6 text-sm text-base-content/70">
            {ingredients && ingredients.length > 0 && (
              <div class="flex items-center">
                <svg
                  class="mr-1 w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <title>Ingredients icon</title>
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                {ingredients.slice(0, 2).join(", ")}
                {ingredients.length > 2 && ` +${ingredients.length - 2} more`}
              </div>
            )}
            {dietary_options && dietary_options.length > 0 && (
              <div class="flex items-center">
                <svg
                  class="mr-1 w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <title>Dietary options icon</title>
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
                {dietary_options
                  .slice(0, 2)
                  .map(formatDietaryOption)
                  .join(", ")}
                {dietary_options.length > 2 &&
                  ` +${dietary_options.length - 2} more`}
              </div>
            )}
            {calories && (
              <div class="flex items-center">
                <svg
                  class="mr-1 w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <title>Calories icon</title>
                  <path
                    fill-rule="evenodd"
                    d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                    clip-rule="evenodd"
                  />
                </svg>
                {calories} cal
              </div>
            )}
          </div>

          <div class="justify-between items-center pt-4 border-t border-base-200 card-actions">
            <div class="text-left">
              <div class="text-xs text-base-content/50 uppercase tracking-wide">
                Price
              </div>
              <div class="font-bold text-primary text-2xl">
                {formatPrice(price, defaultCurrency)}
              </div>
              {allergens && allergens.length > 0 && (
                <div class="mt-2 text-xs text-base-content/50">
                  Allergens:{" "}
                  {allergens.slice(0, 2).map(formatAllergen).join(", ")}
                  {allergens.length > 2 && ` +${allergens.length - 2} more`}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);
