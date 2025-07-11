import qwik from '@qwikdev/astro';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  integrations: [qwik()],
  server: {
    host: true,
    port: 4321,
  },
  // Output configuration for server-side rendering (SSR)
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),

  // Production site configuration for wildcard subdomain support
  site:
    process.env.NODE_ENV === 'production'
      ? 'https://daotomata.io'
      : 'http://localhost:4321',

  vite: {
    plugins: [tailwindcss()],
    define: {
      // Make environment variables available to client-side code
      'import.meta.env.DIRECTUS_URL': JSON.stringify(
        process.env.DIRECTUS_PUBLIC_URL ||
          process.env.DIRECTUS_URL ||
          'https://hotels.daotomata.io'
      ),
      'import.meta.env.DIRECTUS_ADMIN_TOKEN': JSON.stringify(
        process.env.DIRECTUS_ADMIN_TOKEN || 'rYncRSsu41KQQLvZYczPJyC8-8yzyED3'
      ),
    },
  },
});
