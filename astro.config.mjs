import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import qwik from '@qwikdev/astro';

export default defineConfig({
  integrations: [qwik()],
  server: {
    host: true,
    port: 4321,
  },
  // Output configuration for multitenant SSG
  output: 'static',

  // Production site configuration
  site: process.env.NODE_ENV === 'production'
    ? 'https://yourdomain.com'
    : 'http://localhost:4322',

  vite: {
    plugins: [tailwindcss()],
    define: {
      // Make environment variables available to client-side code
      'import.meta.env.DIRECTUS_URL': JSON.stringify(
        process.env.DIRECTUS_PUBLIC_URL || process.env.DIRECTUS_URL || 'https://hotels.daotomata.io',
      ),
      'import.meta.env.DIRECTUS_ADMIN_TOKEN': JSON.stringify(
        process.env.DIRECTUS_ADMIN_TOKEN || 'rYncRSsu41KQQLvZYczPJyC8-8yzyED3',
      ),
    },
  },
});
