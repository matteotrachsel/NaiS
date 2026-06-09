import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';
// @ts-expect-error – reine JS-Hilfsdatei ohne Typen
import { identify } from './api/_plantnet.mjs';
// @ts-expect-error – reine JS-Hilfsdatei ohne Typen
import { fsCreate, fsList } from './api/_firestore.mjs';

/**
 * Dev-Middleware: bildet die Vercel-Serverless-Proxys `/api/identify`
 * (PlantNet) und `/api/firestore` (Firestore) lokal nach, damit `npm run dev`
 * dieselben Endpunkte bietet wie die Produktion.
 */
function apiDevProxy(): Plugin {
  return {
    name: 'api-dev-proxy',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/identify', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }
        try {
          let raw = '';
          for await (const chunk of req) raw += chunk;
          const { imageBase64, organ } = JSON.parse(raw || '{}');
          const { status, body } = await identify({ imageBase64, organ });
          res.statusCode = status;
          res.setHeader('content-type', 'application/json');
          res.end(body);
        } catch (e) {
          res.statusCode = 502;
          res.end(JSON.stringify({ error: String(e) }));
        }
      });

      server.middlewares.use('/api/firestore', async (req, res) => {
        try {
          const url = new URL(req.url ?? '', 'http://localhost');
          const collection = url.searchParams.get('collection') ?? '';
          if (collection !== 'observations' && collection !== 'zonen') {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Unbekannte Collection.' }));
            return;
          }
          let out;
          if (req.method === 'GET') {
            out = await fsList(collection, 300);
          } else if (req.method === 'POST') {
            let raw = '';
            for await (const chunk of req) raw += chunk;
            out = await fsCreate(collection, JSON.parse(raw || '{}'));
          } else {
            res.statusCode = 405;
            res.end('Method Not Allowed');
            return;
          }
          res.statusCode = out.status;
          res.setHeader('content-type', 'application/json');
          res.end(out.body);
        } catch (e) {
          res.statusCode = 502;
          res.end(JSON.stringify({ error: String(e) }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Nicht-prefixte Env-Vars (z. B. PLANTNET_API_KEY aus .env) in process.env
  // spiegeln, damit die Dev-Middleware den Key findet.
  const env = loadEnv(mode, process.cwd(), '');
  for (const k of [
    'PLANTNET_API_KEY',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_API_KEY',
  ]) {
    if (env[k]) process.env[k] = env[k];
  }

  return {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    apiDevProxy(),
    react(),
    VitePWA({
      // 'autoUpdate' = neuer Service Worker übernimmt sofort beim nächsten Start.
      registerType: 'autoUpdate',
      // Service Worker auch im `vite dev` testbar machen.
      devOptions: { enabled: true },
      // Statische Assets, die NICHT vom Bundler erfasst werden (Icons).
      includeAssets: ['icons/*'],
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
        // App-Shell (JS/CSS/HTML/Icons) wird beim Install vollständig precached
        // -> Offline-Start. Daten sind im Bundle, daher kein Runtime-Caching nötig.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,json}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        // PlantNet (cross-origin, online) wird bewusst NICHT gecacht.
      },
    }),
  ],
  };
});
