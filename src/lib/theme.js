/**
 * Generate unified theme CSS using the SAME system that works in the main page
 * This replicates exactly the working system from /[hotel].astro
 */
export function generateThemeCSS(hotel, hotelSubdomain) {
  const themeConfig = hotel.themes?.[0]?.config || {};
  const colors = themeConfig.colors || {};
  const typography = themeConfig.typography || {};
  const layout = themeConfig.layout || {};
  const components = themeConfig.components || {};

  const themeName = `${hotelSubdomain}-theme`;

  // Use EXACTLY the same CSS structure that works in the main page
  const themeCSS = `
  /* DaisyUI Custom Theme for ${hotel.name} */
  [data-theme="${themeName}"] {
    color-scheme: light;

    /* DaisyUI Color Variables */
    --color-primary: ${colors.primary || '#174972'};
    --color-primary-content: ${components.buttons?.primaryText || '#ffffff'};
    --color-secondary: ${colors.secondary || '#dfa73f'};
    --color-secondary-content: ${components.buttons?.secondaryText || '#ffffff'};
    --color-accent: ${colors.accent || '#ececec'};
    --color-accent-content: ${colors.text || '#2c3e50'};
    --color-neutral: ${colors.text || '#2c3e50'};
    --color-neutral-content: ${colors.background || '#ffffff'};
    --color-base-100: ${colors.background || '#ffffff'};
    --color-base-200: ${colors.surface || '#f8f9fa'};
    --color-base-300: ${components.cards?.borderColor || '#e8f4fd'};
    --color-base-content: ${colors.text || '#2c3e50'};
    --color-info: ${colors.primary || '#174972'};
    --color-info-content: ${components.buttons?.primaryText || '#ffffff'};
    --color-success: ${colors.success || '#27ae60'};
    --color-success-content: #ffffff;
    --color-warning: ${colors.warning || '#f39c12'};
    --color-warning-content: #ffffff;
    --color-error: ${colors.error || '#e74c3c'};
    --color-error-content: #ffffff;

    /* DaisyUI Border Radius Variables */
    --radius-box: ${layout.borderRadius || '8px'};
    --radius-field: ${layout.borderRadius || '8px'};
    --radius-selector: ${layout.borderRadius || '8px'};

    /* Custom Typography Variables */
    --font-family: ${typography.fontFamily || 'Inter, sans-serif'};
    --font-heading: ${typography.headingFont || 'Inter, sans-serif'};
    --font-detail: ${typography.detailFont || 'Inter, serif'};
  }

  body {
    font-family: var(--font-family);
    background-color: var(--color-base-100);
    color: var(--color-base-content);
  }

  .font-head {
    font-family: var(--font-heading);
    font-weight: 300;
  }

  .font-detail {
    font-family: var(--font-detail);
    font-style: italic;
  }

  /* DaisyUI component styling */
  .btn-primary {
    background-color: var(--color-primary);
    color: var(--color-primary-content);
    border-color: var(--color-primary);
  }

  .btn-secondary {
    background-color: var(--color-secondary);
    color: var(--color-secondary-content);
    border-color: var(--color-secondary);
  }

  .card {
    background-color: var(--color-base-100);
    border-color: var(--color-base-300);
  }

  /* Hotel-specific border radius overrides */
  ${
  hotelSubdomain === 'baberrih'
    ? `
    .card, .btn, .badge, .input, .select, .textarea, .rounded-lg, .rounded-full, .nav-link {
      border-radius: 0px !important;
    }
    [data-theme="${themeName}"] {
      --radius-box: 0px;
      --radius-field: 0px;
      --radius-selector: 0px;
    }
  `
    : ''
}

  ${
  hotelSubdomain === 'demo'
    ? `
    .card, .btn, .badge, .input, .select, .textarea, .rounded-lg, .rounded-full, .nav-link {
      border-radius: 12px !important;
    }
    [data-theme="${themeName}"] {
      --radius-box: 12px;
      --radius-field: 12px;
      --radius-selector: 12px;
    }
  `
    : ''
}
`;

  return themeCSS;
}

/**
 * Get theme name for a hotel
 */
export function getThemeName(hotelSubdomain) {
  return `${hotelSubdomain}-theme`;
}
