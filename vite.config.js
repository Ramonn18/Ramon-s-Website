import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Blog entries (src/posts/*.md) as the `virtual:blog-posts` module.
// Production builds leave drafts out entirely, so their text never ships to the
// live site; the dev server includes them and reloads when an entry changes.
function blogPosts() {
  const moduleId = 'virtual:blog-posts'
  const resolvedId = `\0${moduleId}`
  const postsDir = path.resolve('src/posts')
  let includeDrafts = true

  const isDraft = (raw) => {
    const frontMatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw)?.[1] ?? ''
    return /^draft:\s*true\s*$/m.test(frontMatter)
  }

  return {
    name: 'blog-posts',
    configResolved(config) {
      includeDrafts = config.command === 'serve'
    },
    resolveId: (source) => (source === moduleId ? resolvedId : null),
    load(id) {
      if (id !== resolvedId) return null
      const entries = fs
        .readdirSync(postsDir)
        .filter((file) => file.endsWith('.md'))
        .map((file) => {
          const fullPath = path.join(postsDir, file)
          this.addWatchFile(fullPath)
          return [file, fs.readFileSync(fullPath, 'utf8')]
        })
        .filter(([, raw]) => includeDrafts || !isDraft(raw))
      return `export default ${JSON.stringify(Object.fromEntries(entries))}`
    },
    configureServer(server) {
      const reload = (file) => {
        if (!file.startsWith(postsDir) || !file.endsWith('.md')) return
        const mod = server.moduleGraph.getModuleById(resolvedId)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.add(postsDir)
      server.watcher.on('add', reload)
      server.watcher.on('change', reload)
      server.watcher.on('unlink', reload)
    },
  }
}

// https://vite.dev/config/
// Hosted on Netlify at the domain root; routing fallback lives in netlify.toml
export default defineConfig({
  plugins: [react(), blogPosts()],
})
