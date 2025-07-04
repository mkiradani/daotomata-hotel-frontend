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
      'import.meta.env.SUPABASE_URL': JSON.stringify(
        process.env.SUPABASE_URL || 'http://localhost:54321',
      ),
      'import.meta.env.SUPABASE_ANON_KEY': JSON.stringify(
        process.env.SUPABASE_ANON_KEY ||
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
      ),
      'import.meta.env.DIRECTUS_URL': JSON.stringify(
        process.env.DIRECTUS_PUBLIC_URL || process.env.DIRECTUS_URL || 'http://localhost:8055',
      ),
      'import.meta.env.DIRECTUS_ADMIN_TOKEN': JSON.stringify(
        process.env.DIRECTUS_ADMIN_TOKEN || 't2f0hAJoDEeLdoLZkRX64bCRtPd2zSLh',
      ),
    },
  },
});
