import qwik from '@qwikdev/astro';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import { loadEnv } from 'vite';

// Load environment variables
const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');

export default defineConfig({
  integrations: [qwik()],
  adapter: node({
    mode: 'standalone'
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
      'import.meta.env.HOTEL_ID': JSON.stringify(
        env.HOTEL_ID || '1'
      ),
    },
  },
});
