/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Dev: proxy the API onto the launcher origin so the cross-origin cookie and
// the magic-link consume → redirect round-trip work without CORS. The auth
// client is pointed at the same origin (empty apiBase) in dev. See README.
const API_TARGET = "http://localhost:8787";
const proxy = Object.fromEntries(
  ["/me", "/auth", "/profiles", "/health"].map((p) => [
    p,
    { target: API_TARGET, changeOrigin: true },
  ]),
);

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon.svg"],
      manifest: {
        name: "RumpusRoom",
        short_name: "RumpusRoom",
        description: "The safe, ad-free app drawer for kids' tablets.",
        theme_color: "#6366f1",
        background_color: "#f8fafc",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
          { src: "icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
          {
            src: "icons/icon-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Network-first for the session endpoint, default cache-first for assets.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname === "/me",
            handler: "NetworkFirst",
            options: { cacheName: "me" },
          },
        ],
      },
    }),
  ],
  server: { port: 5173, proxy },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    css: true,
  },
});
