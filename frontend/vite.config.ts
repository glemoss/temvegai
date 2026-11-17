import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // The site installs as an app. The service worker keeps the site
    // itself (HTML, JS, CSS, icons and the MapLibre worker) on the device,
    // and a new version only takes over when the visitor taps "Atualizar".
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'Tem Veg Aí?',
        short_name: 'Tem Veg Aí?',
        description:
          'Mapa de restaurantes veganos e com opções veganas em Florianópolis.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#2f6b3a',
        background_color: '#e3f1dc',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // The .mjs is the MapLibre worker. The icons of the manifest come in
        // by the plugin.
        globPatterns: ['**/*.{js,mjs,css,html,svg}'],
        // The site is a single JS file of about 1.8 MB, close to the 2 MiB
        // default, above which Workbox leaves a file out of the cache.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // The site goes to index.html on any path, but the API always goes
        // to the network, and so do the map tiles, which are not cached.
        navigateFallbackDenylist: [/^\/api\//],
        // The Bebas Neue font of the title, from Google Fonts, so the
        // title keeps it without internet.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    // Vite resolves paths starting with / from the project root.
    alias: { '@': '/src' },
  },
});
