#!/usr/bin/env node

/**
 * Build-time theme generator for DRY SSG theme system
 * Reads Directus hotel configurations and generates static CSS and font URLs
 *
 * This script implements the DRY principle where Directus is the single source of truth
 * for all theme configuration, generating static assets at build time for SSG.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { createDirectus, readItems, rest, staticToken } from "@directus/sdk";
import fetch from "node-fetch";

// Directus configuration - using the same URLs as the main project
const DIRECTUS_URL = process.env.DIRECTUS_URL || "https://hotels.daotomata.io";
const DIRECTUS_TOKEN =
  process.env.DIRECTUS_ADMIN_TOKEN || "rYncRSsu41KQQLvZYczPJyC8-8yzyED3";

// Output paths
const THEMES_CSS_PATH = "src/styles/themes.css";
const FONTS_CONFIG_PATH = "src/generated/fonts-config.json";

/**
 * Initialize Directus client with proper authentication and fetch polyfill
 */
function createDirectusClient() {
  const client = createDirectus(DIRECTUS_URL, {
    globals: {
      fetch: fetch,
    },
  })
    .with(rest())
    .with(staticToken(DIRECTUS_TOKEN));

  return client;
}

/**
 * Fetch all hotels with theme configuration from Directus
 */
async function fetchHotelsFromDirectus() {
  console.log("🔄 Fetching hotels from Directus...");

  const client = createDirectusClient();

  try {
    const hotels = await client.request(
      readItems("hotels", {
        fields: ["id", "name", "theme"],
        limit: -1, // Get all hotels
      }),
    );

    console.log(`✅ Fetched ${hotels.length} hotels from Directus`);
    return hotels;
  } catch (error) {
    console.error("❌ Error fetching hotels from Directus:", error);
    throw error;
  }
}

/**
 * Generate DaisyUI theme CSS from hotel configuration
 * Matches the exact format that currently works in themes.css
 */
function generateThemeCSS(hotel) {
  if (!hotel?.theme) {
    console.warn(`⚠️  No theme configuration found for hotel: ${hotel?.name}`);
    return "";
  }

  const theme = hotel.theme;
  console.log(`🎨 Generating theme CSS for: ${hotel.name} (${theme.name})`);

  // Generate @plugin "daisyui/theme" CSS block matching current working format
  const themeCSS = `
/* ${hotel.name} Theme - From Directus */
@plugin "daisyui/theme" {
  name: "${theme.name}";
  default: ${theme.default || false};
  prefersdark: ${theme.prefersdark || false};
  color-scheme: ${theme["color-scheme"] || "light"};

  /* OKLCH Colors from Directus */
${Object.entries(theme.colors || {})
  .map(([key, value]) => `  ${key}: ${value};`)
  .join("\n")}

  /* Layout from Directus */
${Object.entries(theme.layout || {})
  .map(([key, value]) => `  ${key}: ${value};`)
  .join("\n")}

  /* Sizes from Directus */
${Object.entries(theme.sizes || {})
  .map(([key, value]) => `  ${key}: ${value};`)
  .join("\n")}

  /* Effects from Directus */
${Object.entries(theme.effects || {})
  .map(([key, value]) => `  ${key}: ${value};`)
  .join("\n")}
}`;

  return themeCSS;
}

/**
 * Generate complete themes.css file with all hotel themes
 */
function generateCompleteThemesCSS(hotels) {
  console.log("🎨 Generating complete themes.css file...");

  const header = `/* DaisyUI Custom Themes - Generated from Directus Configuration */
/* This file is automatically generated at build time - DO NOT EDIT MANUALLY */
/* Source: Directus hotels collection theme configurations */
/* Generated: ${new Date().toISOString()} */

@import "tailwindcss";
@plugin "daisyui";
`;

  const themesCSS = hotels
    .filter((hotel) => hotel.theme) // Only hotels with theme configuration
    .map((hotel) => generateThemeCSS(hotel))
    .join("\n");

  return header + themesCSS;
}

/**
 * Generate Google Fonts URL from font configuration
 */
function generateGoogleFontsURL(fontName, weight = "400", style = "normal") {
  const encodedFontName = fontName.replace(/\s+/g, "+");

  if (style === "italic") {
    return `family=${encodedFontName}:ital,wght@1,${weight}`;
  } else {
    return `family=${encodedFontName}:wght@${weight}`;
  }
}

/**
 * Generate Google Fonts configuration from hotel themes
 */
function generateFontsConfig(hotels) {
  console.log("🔤 Generating fonts configuration...");

  const fontsConfig = {
    generated: new Date().toISOString(),
    hotels: {},
  };

  for (const hotel of hotels) {
    if (!hotel.theme?.fonts) continue;

    const fonts = hotel.theme.fonts;

    // Generate individual font URLs
    const fontQueries = [];

    if (fonts.primary) {
      const fontName = fonts.primary.name || fonts.primary;
      const weight = fonts.primary.weight || "400";
      const style = fonts.primary.style || "normal";
      fontQueries.push(generateGoogleFontsURL(fontName, weight, style));
    }

    if (fonts.secondary) {
      const fontName = fonts.secondary.name || fonts.secondary;
      const weight = fonts.secondary.weight || "400";
      const style = fonts.secondary.style || "normal";
      // Only add if different from primary
      if (fontName !== (fonts.primary.name || fonts.primary)) {
        fontQueries.push(generateGoogleFontsURL(fontName, weight, style));
      }
    }

    if (fonts.mono) {
      const fontName = fonts.mono.name || fonts.mono;
      const weight = fonts.mono.weight || "400";
      const style = fonts.mono.style || "normal";
      // Only add if different from primary and secondary
      const primaryName = fonts.primary.name || fonts.primary;
      const secondaryName = fonts.secondary.name || fonts.secondary;
      if (fontName !== primaryName && fontName !== secondaryName) {
        fontQueries.push(generateGoogleFontsURL(fontName, weight, style));
      }
    }

    if (fonts.detail) {
      const fontName = fonts.detail.name || fonts.detail;
      const weight = fonts.detail.weight || "400";
      const style = fonts.detail.style || "normal";
      // Only add if different from other fonts
      const primaryName = fonts.primary.name || fonts.primary;
      const secondaryName = fonts.secondary.name || fonts.secondary;
      const monoName = fonts.mono.name || fonts.mono;
      if (
        fontName !== primaryName &&
        fontName !== secondaryName &&
        fontName !== monoName
      ) {
        fontQueries.push(generateGoogleFontsURL(fontName, weight, style));
      }
    }

    // Build complete Google Fonts URL
    const baseURL = "https://fonts.googleapis.com/css2?";
    const displayQuery = "&display=swap";
    const googleFontsURL = `${baseURL}${fontQueries.join("&")}${displayQuery}`;

    fontsConfig.hotels[hotel.name] = {
      themeName: hotel.theme.name,
      fonts: {
        primary: fonts.primary.name || fonts.primary || "Inter",
        secondary:
          fonts.secondary.name || fonts.secondary || "Playfair Display",
        mono: fonts.mono.name || fonts.mono || "JetBrains Mono",
        detail: fonts.detail.name || fonts.detail || "Inter",
      },
      weights: {
        primary: fonts.primary.weight || "400",
        secondary: fonts.secondary.weight || "400",
        mono: fonts.mono.weight || "400",
        detail: fonts.detail.weight || "400",
      },
      styles: {
        primary: fonts.primary.style || "normal",
        secondary: fonts.secondary.style || "normal",
        mono: fonts.mono.style || "normal",
        detail: fonts.detail.style || "normal",
      },
      googleFontsURL: googleFontsURL,
    };

    console.log(`🔤 Generated fonts config for: ${hotel.name}`);
    console.log(`🔤 Google Fonts URL: ${googleFontsURL}`);
  }

  return fontsConfig;
}

/**
 * Write generated files to disk
 */
function writeGeneratedFiles(themesCSS, fontsConfig) {
  console.log("💾 Writing generated files...");

  // Ensure directories exist
  mkdirSync(dirname(THEMES_CSS_PATH), { recursive: true });
  mkdirSync(dirname(FONTS_CONFIG_PATH), { recursive: true });

  // Write themes.css
  writeFileSync(THEMES_CSS_PATH, themesCSS, "utf8");
  console.log(`✅ Generated: ${THEMES_CSS_PATH}`);

  // Write fonts configuration
  writeFileSync(
    FONTS_CONFIG_PATH,
    JSON.stringify(fontsConfig, null, 2),
    "utf8",
  );
  console.log(`✅ Generated: ${FONTS_CONFIG_PATH}`);
}

/**
 * Main theme generation function
 */
async function generateThemes() {
  console.log("🚀 Starting DRY theme generation from Directus...");
  console.log(`📡 Directus URL: ${DIRECTUS_URL}`);

  try {
    // Fetch hotels from Directus
    const hotels = await fetchHotelsFromDirectus();

    if (hotels.length === 0) {
      console.warn("⚠️  No hotels found in Directus");
      return;
    }

    // Generate CSS and fonts configuration
    const themesCSS = generateCompleteThemesCSS(hotels);
    const fontsConfig = generateFontsConfig(hotels);

    // Write files
    writeGeneratedFiles(themesCSS, fontsConfig);

    console.log("✅ DRY theme generation completed successfully!");
    console.log(`📊 Generated themes for ${hotels.length} hotels`);
  } catch (error) {
    console.error("❌ Theme generation failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateThemes();
}

export { generateThemes };
