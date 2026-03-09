import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://abovedeck.io',
  integrations: [react(), sitemap()],
  vite: {
    ssr: {
      noExternal: ['@mantine/core', '@mantine/hooks'],
    },
  },
});
