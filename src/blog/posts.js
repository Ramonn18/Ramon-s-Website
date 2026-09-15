// Loads every Markdown entry in src/posts at build time.
// See WRITING.md for the front matter fields.

const files = import.meta.glob('../posts/*.md', { query: '?raw', import: 'default', eager: true })

// Drafts are visible while writing (npm run dev) and hidden on the live site
const showDrafts = import.meta.env.DEV

const PHASE_ORDER = ['Research', 'Concept', 'Prototype', 'Critique']

function parseFrontMatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw)
  if (!match) return { data: {}, body: raw }

  const data = {}
  for (const line of match[1].split(/\r?\n/)) {
    const field = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line)
    if (!field) continue
    let value = field[2].trim().replace(/^(['"])(.*)\1$/, '$2')
    if (value === 'true') value = true
    else if (value === 'false') value = false
    data[field[1]] = value
  }
  return { data, body: raw.slice(match[0].length) }
}

const chronological = Object.entries(files)
  .map(([path, raw]) => {
    const { data, body } = parseFrontMatter(raw)
    const slug = path.split('/').pop().replace(/\.md$/, '')
    return {
      slug,
      title: data.title || slug,
      date: String(data.date || ''),
      phase: data.phase || '',
      summary: data.summary || '',
      draft: data.draft === true,
      body,
    }
  })
  .filter((post) => showDrafts || !post.draft)
  .sort((a, b) => a.date.localeCompare(b.date) || a.slug.localeCompare(b.slug))
  .map((post, index) => ({ ...post, number: String(index + 1).padStart(2, '0') }))

/** Newest first */
export const posts = [...chronological].reverse()

export const getPost = (slug) => posts.find((post) => post.slug === slug)

const phaseRank = (phase) => {
  const index = PHASE_ORDER.indexOf(phase)
  return index === -1 ? PHASE_ORDER.length : index
}

export const phases = [...new Set(posts.map((post) => post.phase).filter(Boolean))].sort(
  (a, b) => phaseRank(a) - phaseRank(b) || a.localeCompare(b),
)

export function formatDate(date) {
  const parsed = new Date(`${date}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}
