import { copyFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages has no fallback for app routes like /blog/some-entry, but it
// serves 404.html for unknown paths, so ship the app there too.
const githubPagesFallback = {
  name: 'github-pages-404-fallback',
  apply: 'build',
  closeBundle: () => copyFile(resolve('dist/index.html'), resolve('dist/404.html')),
}

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the site from /<repo-name>/
  base: '/Ramon-s-Website/',
  plugins: [react(), githubPagesFallback],
})
