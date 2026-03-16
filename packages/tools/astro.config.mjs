import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import AstroPWA from '@vite-pwa/astro';

export default defineConfig({
  site: 'https://abovedeck.io',
  base: '/tools',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    react(),
    AstroPWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Above Deck Tools',
        short_name: 'Deck Tools',
        description: 'Sailing tools for modern cruisers',
        start_url: '/tools',
        display: 'standalone',
        background_color: '#1a1a2e',
        theme_color: '#1a1a2e',
        orientation: 'portrait-primary',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  vite: {
    ssr: {
      noExternal: ['@mantine/core', '@mantine/hooks'],
    },
  },
});
