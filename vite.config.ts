import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// Force fresh cache with timestamp
const CACHE_BUST = Date.now().toString(36);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Use unique cache directory to force fresh dependency optimization
  cacheDir: `node_modules/.vite-${CACHE_BUST}`,
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.jpeg", "robots.txt", "pwa-192x192.png", "pwa-512x512.png"],
      manifest: {
        name: "AURRA - Life OS",
        short_name: "AURRA",
        description: "Your ambient AI companion that listens, understands, remembers, guides, and grows with you. Not a chatbot. A Life OS.",
        theme_color: "#0d9488",
        background_color: "#0a0a0a",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        id: "/",
        categories: ["productivity", "lifestyle", "health"],
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "Chat with AURRA",
            short_name: "Chat",
            description: "Start a conversation",
            url: "/",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "Daily Plan",
            short_name: "Plan",
            description: "View today's plan",
            url: "/daily-plan",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "Timeline",
            short_name: "Timeline",
            description: "View your life timeline",
            url: "/timeline",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "Mood Check-in",
            short_name: "Mood",
            description: "Log how you're feeling",
            url: "/mood",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }],
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpeg,jpg,woff,woff2}"],
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 31536000 },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Force all React imports to use the same instance
      "react": path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      "react-dom/client": path.resolve(__dirname, "node_modules/react-dom/client"),
      "react/jsx-runtime": path.resolve(__dirname, "node_modules/react/jsx-runtime"),
      "react/jsx-dev-runtime": path.resolve(__dirname, "node_modules/react/jsx-dev-runtime"),
    },
    dedupe: [
      "react", 
      "react-dom", 
      "react/jsx-runtime", 
      "react/jsx-dev-runtime",
      "@tanstack/react-query", 
      "framer-motion"
    ],
  },
  optimizeDeps: {
    include: [
      "react", 
      "react-dom", 
      "react-dom/client",
      "react/jsx-runtime",
      "@tanstack/react-query"
    ],
    force: true,
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
}));
