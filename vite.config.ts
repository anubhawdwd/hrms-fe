import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  resolve: {
    extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json"],
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: [
      "tender-employ-hampton-seeing.trycloudflare.com",
      "192.168.1.185",
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-mui-core": [
            "@mui/material",
            "@emotion/react",
            "@emotion/styled",
          ],
          "vendor-mui-icons": ["@mui/icons-material"],
          "vendor-mui-pickers": ["@mui/x-date-pickers"],
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-redux": ["@reduxjs/toolkit", "react-redux"],
          "vendor-utils": ["axios", "dayjs", "react-hot-toast"],
          "vendor-socket": ["socket.io-client"],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "HRMS",
        short_name: "HRMS",
        theme_color: "#1976d2",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
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
        ],
      },
    }),
  ],
})
