import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/http-ping-matrix/',
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0')
  },
  plugins: [
    vue(),
    Icons({
      compiler: 'vue3',
      defaultClass: 'icon',
      autoInstall: false
    }),
    VitePWA({
      base: '/http-ping-matrix/',
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'favicon-48x48.png',
        'apple-touch-icon.png'
      ],
      manifest: {
        id: '/http-ping-matrix/',
        name: 'Ping Matrix',
        short_name: 'Ping Matrix',
        description: '复古风 HTTP 探测矩阵面板，可监控多个站点延迟与日志。',
        start_url: '/http-ping-matrix/',
        scope: '/http-ping-matrix/',
        display: 'standalone',
        background_color: '#05060e',
        theme_color: '#0f1629',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,webp,woff2}'],
        navigateFallback: '/http-ping-matrix/index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'ping-matrix-pages'
            }
          },
          {
            urlPattern: ({ sameOrigin, request }) =>
              sameOrigin && ['style', 'script', 'worker'].includes(request.destination),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'ping-matrix-static'
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
