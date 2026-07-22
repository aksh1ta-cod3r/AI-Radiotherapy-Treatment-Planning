import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: [
      'https://banjo-babied-doubling.ngrok-free.dev'
    ],
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
});
