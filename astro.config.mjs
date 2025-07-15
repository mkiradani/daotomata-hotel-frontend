import qwik from '@qwikdev/astro';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import dotenv from 'dotenv';

// Load environment variables (only if not already set in system env)
dotenv.config({ override: false }); // Don't override existing environment variables
const env = process.env;

// Debug environment variables
console.log('🔍 [ASTRO CONFIG DEBUG] Environment variables:');
console.log(`🔍 [ASTRO CONFIG DEBUG] NODE_ENV: ${env.NODE_ENV}`);
console.log(`🔍 [ASTRO CONFIG DEBUG] HOTEL_ID: ${env.HOTEL_ID}`);
console.log(`🔍 [ASTRO CONFIG DEBUG] DIRECTUS_URL: ${env.DIRECTUS_URL}`);
console.log(`🔍 [ASTRO CONFIG DEBUG] SITE_URL: ${env.SITE_URL}`);

export default defineConfig({
  integrations: [qwik()],
  adapter: node({
    mode: 'standalone',
  }),
  server: {
    host: true,
    port: 4321,
  },
  // Hybrid mode: SSG for content pages, SSR for booking pages
  output: 'server',

  // Dynamic site configuration - automatically determined from hotel data or environment
  site: env.SITE_URL || 'http://localhost:4321',

  vite: {
    plugins: [tailwindcss()],
    esbuild: {
      jsx: 'preserve', // Preserve JSX for Qwik processing
    },
    define: {
      // Make environment variables available to client-side code
      'import.meta.env.DIRECTUS_URL': JSON.stringify(
        env.DIRECTUS_PUBLIC_URL ||
          env.DIRECTUS_URL ||
          'https://hotels.daotomata.io'
      ),
      'import.meta.env.DIRECTUS_ADMIN_TOKEN': JSON.stringify(
        env.DIRECTUS_ADMIN_TOKEN || 'rYncRSsu41KQQLvZYczPJyC8-8yzyED3'
      ),
      // Single-tenant hotel configuration
      'import.meta.env.HOTEL_ID': JSON.stringify(env.HOTEL_ID || '1'),
    },
  },
});
