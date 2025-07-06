/** @jsxImportSource @builder.io/qwik */
import { component$ } from '@builder.io/qwik';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb = component$<BreadcrumbProps>(({ items }) => {
  // Guard against undefined items
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav class="bg-base-200/50 px-4 py-3 border-b border-base-300">
      <div class="mx-auto max-w-7xl">
        <div class="flex items-center space-x-2 text-sm">
          {items.map((item, index) => (
            <div key={`${item.label}-${index}`} class="flex items-center">
              {index > 0 && <span class="mx-2 text-base-content/50">/</span>}
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
  );
});
