/** @jsxImportSource @builder.io/qwik */
import { component$ } from '@builder.io/qwik';

interface DishCardProps {
  name: string;
  description: string;
  ingredients?: string[];
  dietaryOptions?: string[];
  allergens?: string[];
  calories?: number;
  imageUrl: string;
  isAvailable: boolean;
}

export const DishCard = component$<DishCardProps>(
  ({
    name,
    description,
    ingredients,
    dietaryOptions,
    allergens,
    calories,
    imageUrl,
    isAvailable,
  }) => {
    const formatDietaryOption = (option: string) => {
      return option.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    };

    const formatAllergen = (allergen: string) => {
      return allergen.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    };

    return (
      <div
        class={`bg-base-100 border-2 border-base-300 card overflow-hidden ${!isAvailable ? 'opacity-60' : ''}`}
      >
        {imageUrl && (
          <figure class="relative overflow-hidden">
            <img src={imageUrl} alt={name} class="w-full object-cover aspect-video" />
            {!isAvailable && (
              <div class="top-4 left-4 z-10 absolute">
                <div class="bg-error/80 backdrop-blur-sm border border-error-content/20 font-semibold badge badge-error badge-lg">
                  Not Available
                </div>
              </div>
            )}
          </figure>
        )}

        <div class="p-4 card-body">
          <h3 class="mb-2 font-head text-primary text-lg card-title">{name}</h3>

          <p class="mb-3 text-sm text-base-content/70 line-clamp-2 leading-relaxed">
            {description}
          </p>

          {ingredients && ingredients.length > 0 && (
            <div class="mb-3">
              <div class="text-xs text-base-content/50 uppercase tracking-wide mb-1">
                Ingredients
              </div>
              <div class="flex flex-wrap gap-1">
                {ingredients.slice(0, 3).map((ingredient, index) => (
                  <span key={index} class="badge badge-outline badge-xs">
                    {ingredient}
                  </span>
                ))}
                {ingredients.length > 3 && (
                  <span class="badge badge-outline badge-xs">+{ingredients.length - 3} more</span>
                )}
              </div>
            </div>
          )}

          {dietaryOptions && dietaryOptions.length > 0 && (
            <div class="mb-3">
              <div class="text-xs text-base-content/50 uppercase tracking-wide mb-1">Dietary</div>
              <div class="flex flex-wrap gap-1">
                {dietaryOptions.slice(0, 2).map((option, index) => (
                  <span key={index} class="badge badge-success badge-xs">
                    {formatDietaryOption(option)}
                  </span>
                ))}
                {dietaryOptions.length > 2 && (
                  <span class="badge badge-success badge-xs">
                    +{dietaryOptions.length - 2} more
                  </span>
                )}
              </div>
            </div>
          )}

          <div class="flex justify-between items-center pt-3 border-t border-base-200">
            <div class="text-left">
              {calories && <div class="text-xs text-base-content/50">{calories} cal</div>}
            </div>

            {allergens && allergens.length > 0 && (
              <div class="text-right">
                <div class="text-xs text-base-content/50 mb-1">Allergens</div>
                <div class="flex flex-wrap gap-1 justify-end">
                  {allergens.slice(0, 2).map((allergen, index) => (
                    <span key={index} class="badge badge-warning badge-xs">
                      {formatAllergen(allergen)}
                    </span>
                  ))}
                  {allergens.length > 2 && (
                    <span class="badge badge-warning badge-xs">+{allergens.length - 2}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);
