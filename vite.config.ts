import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      // 'autoUpdate' = neuer Service Worker übernimmt sofort beim nächsten Start.
      registerType: 'autoUpdate',
      // Service Worker auch im `vite dev` testbar machen.
      devOptions: { enabled: true },
      // Statische Assets, die NICHT vom Bundler erfasst werden (Modell, Icons, Daten).
      includeAssets: ['icons/*', 'models/**/*', 'offline.html'],
      manifest: {
        name: 'NaiS Baumartenwahl',
        short_name: 'NaiS',
        description:
          'Offline-Entscheidungshilfe zur Baumartenwahl im Schweizer Schutzwald (NaiS).',
        lang: 'de-CH',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#1a1a1a',
        categories: ['utilities', 'productivity'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App-Shell (JS/CSS/HTML) wird beim Install vollständig precached -> Offline-Start.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,json}'],
        // Das ML-Modell kann mehrere MB gross sein -> Limit anheben.
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Modell-Dateien (model.json + *.bin shards) robust nachcachen,
            // falls sie nicht schon im Precache liegen.
            urlPattern: ({ url }) => url.pathname.startsWith('/models/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'tfjs-model-cache',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // NaiS-Datendateien (falls als statische JSON ausgeliefert).
            urlPattern: ({ url }) => url.pathname.startsWith('/data/'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'nais-data-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
        ],
      },
    }),
  ],
});
