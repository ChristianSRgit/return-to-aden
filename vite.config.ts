import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { VitePWA } from "vite-plugin-pwa";

// Return to Aden — installable, offline-first PWA.
// The game ships a build-time snapshot of l2api.dev data (src/data/generated),
// so the service worker only needs to precache the app shell + icons.
export default defineConfig({
  base: "./",
  plugins: [
    preact(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/*.png"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        // l2api icons + fonts: fall back to cache, refresh in background.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts" },
          },
        ],
      },
      manifest: {
        name: "Return to Aden",
        short_name: "Aden",
        description:
          "RPG por turnos de bolsillo con datos reales de Lineage II Interlude.",
        lang: "es",
        dir: "ltr",
        start_url: "./",
        scope: "./",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0c0a0e",
        theme_color: "#0c0a0e",
        categories: ["games", "entertainment"],
        icons: [
          { src: "icons/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/pwa-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  build: {
    target: "es2022",
    minify: "terser",
  },
});
