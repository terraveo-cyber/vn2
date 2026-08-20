import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['apple-touch-icon.png'],
        manifest: {
          name: 'Mancala Solver',
          short_name: 'Mancala Solver',
          description: 'Mancala (Kalah) solver with win/draw move suggestions for TERRANOVA vs OPPONENT.',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: '#111111',
          theme_color: '#111111',
          icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // App-shell caching (HTML/JS/CSS for fast repeat loads) must not
          // swallow navigations to the server's own real routes - the auth
          // gate (/login, /register, /auth/*, /admin) and the health check
          // are actual server-rendered pages/endpoints, not part of the SPA,
          // and must always hit the network rather than being served from
          // the cached app shell.
          navigateFallbackDenylist: [/^\/(api|login|register|auth|admin)(\/|$)/],
          runtimeCaching: [
            {
              urlPattern: /^\/(api|login|register|auth|admin)(\/|$)/,
              handler: 'NetworkOnly',
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
