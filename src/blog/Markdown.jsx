import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const BASE = import.meta.env.BASE_URL

const isExternal = (url) => /^([a-z]+:)?\/\//i.test(url) || /^(mailto|tel|data):/i.test(url)

// Relative image/video paths point at public/blog/<entry-slug>/
function assetUrl(slug, src = '') {
  if (!src || isExternal(src) || src.startsWith('#')) return src
  if (src.startsWith('/')) return BASE + src.slice(1)
  return `${BASE}blog/${slug}/${src}`
}

function embedFrameSrc(url) {
  if (/figma\.com\/(proto|design|file|board|slides|deck)\//.test(url)) {
    return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`
  }
  const youtube = /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/.exec(url)
  if (youtube) return `https://www.youtube-nocookie.com/embed/${youtube[1]}`
  const vimeo = /vimeo\.com\/(\d+)/.exec(url)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}

function Embed({ slug, url, caption }) {
  const frameSrc = embedFrameSrc(url)
  let media

  if (frameSrc) {
    media = (
      <iframe
        src={frameSrc}
        title={caption || 'Embedded media'}
        loading="lazy"
        allow="fullscreen; picture-in-picture"
        allowFullScreen
      />
    )
  } else if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) {
    media = <video src={assetUrl(slug, url)} controls playsInline preload="metadata" />
  } else {
    return (
      <p>
        <a href={url} target="_blank" rel="noreferrer">
          {caption || url}
        </a>
      </p>
    )
  }

  return (
    <figure className="entry-figure">
      <div className="entry-embed">{media}</div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}

// "← ![alt](photo.jpg)" puts the image on the left and the next paragraph on
// the right; "→" swaps the sides. The arrow can sit before or after the image.
const SIDES = { '←': 'left', '→': 'right' }

function sideOf(node) {
  if (node?.type !== 'paragraph') return null
  const kids = node.children.filter((kid) => !(kid.type === 'text' && !kid.value.trim()))
  if (kids.length !== 2) return null
  const [a, b] = kids
  const [arrow, image] = a.type === 'image' ? [b, a] : [a, b]
  if (image.type !== 'image' || arrow.type !== 'text') return null
  const side = SIDES[arrow.value.trim()]
  if (side) node.children = [image]
  return side ?? null
}

function remarkSideBySide() {
  return (tree) => {
    const out = []
    for (let i = 0; i < tree.children.length; i++) {
      const node = tree.children[i]
      const next = tree.children[i + 1]
      const side = next && sideOf(node)
      if (side) {
        out.push({
          type: 'sideBySide',
          data: { hName: 'div', hProperties: { className: ['entry-split', `entry-split--${side}`] } },
          children: [node, { type: 'sideText', data: { hName: 'div' }, children: [next] }],
        })
        i++
      } else {
        out.push(node)
      }
    }
    tree.children = out
  }
}

const textOf = (node) => node?.children?.map((child) => child.value ?? textOf(child)).join('') ?? ''

export default function Markdown({ slug, children }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkSideBySide]}
      skipHtml
      components={{
        // The entry title is the page's only h1
        h1: ({ node: _node, ...props }) => <h2 {...props} />,

        // An image on its own line becomes a figure; its "title" is the caption.
        // The alt text is also printed under the image as "(image: …)". Screen
        // readers already announce the alt, so the printed copy is hidden from them.
        p({ node, children: content }) {
          const kids = node.children.filter((kid) => !(kid.type === 'text' && !kid.value.trim()))
          if (kids.length === 1 && kids[0].tagName === 'img') {
            const { src, alt, title } = kids[0].properties
            return (
              <figure className="entry-figure">
                <img src={assetUrl(slug, src)} alt={alt || ''} loading="lazy" />
                {alt && (
                  <p className="entry-figure__description" aria-hidden="true">
                    (image: {alt})
                  </p>
                )}
                {title && <figcaption>{title}</figcaption>}
              </figure>
            )
          }
          return <p>{content}</p>
        },

        // Wide tables (column maps) scroll sideways instead of squeezing the page
        table: ({ node: _node, ...props }) => (
          <div className="table-scroll" role="region" aria-label="Table" tabIndex={0}>
            <table {...props} />
          </div>
        ),

        img: ({ node: _node, src, alt, ...props }) => (
          <img {...props} src={assetUrl(slug, src)} alt={alt || ''} loading="lazy" />
        ),

        a: ({ node: _node, href = '', ...props }) =>
          isExternal(href) && !href.startsWith('mailto:') ? (
            <a {...props} href={href} target="_blank" rel="noreferrer" />
          ) : (
            <a {...props} href={href} />
          ),

        // ```embed fences hold a Figma, YouTube, Vimeo or video URL, then an optional caption
        pre({ node, children: content }) {
          const code = node.children[0]
          if (code?.properties?.className?.includes('language-embed')) {
            const [url = '', ...caption] = textOf(code).trim().split('\n')
            return <Embed slug={slug} url={url.trim()} caption={caption.join(' ').trim()} />
          }
          return <pre>{content}</pre>
        },
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
