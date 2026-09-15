import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// Hosted on Netlify at the domain root; routing fallback lives in netlify.toml
export default defineConfig({
  plugins: [react()],
})
