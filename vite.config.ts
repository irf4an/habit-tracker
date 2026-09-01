import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: false,
        suppressWarnings: true,
      },
      includeAssets: ['favicon.svg', 'icons.svg', 'og-image.svg'],
      manifest: {
        name: 'Minimal Habit Tracker',
        short_name: 'Habits',
        description: 'A clean and simple daily habit tracker. Track streaks, build momentum.',
        theme_color: '#0EC9A0',
        background_color: '#0b0b0e',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
          { src: '/favicon.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: '/favicon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Navigate requests must bypass SW — Chrome bfcache + NavigationPreload restore should always hit network for HTML
        navigateFallback: null,
        navigateFallbackDenylist: [/^\/.*$/],
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        globIgnores: ['**/vendor-html2canvas-*.js', '**/vendor-supabase-*.js'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /\/assets\/vendor-(html2canvas|supabase)-.*\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'lazy-vendor',
              expiration: { maxEntries: 6, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('html2canvas')) {
              return 'vendor-html2canvas';
            }
            if (id.includes('canvas-confetti')) {
              return 'vendor-confetti';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('react') || id.includes('scheduler')) {
              return 'vendor-react';
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
