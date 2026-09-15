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

const textOf = (node) => node?.children?.map((child) => child.value ?? textOf(child)).join('') ?? ''

export default function Markdown({ slug, children }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      skipHtml
      components={{
        // The entry title is the page's only h1
        h1: ({ node: _node, ...props }) => <h2 {...props} />,

        // An image on its own line becomes a figure; its "title" is the caption
        p({ node, children: content }) {
          const kids = node.children.filter((kid) => !(kid.type === 'text' && !kid.value.trim()))
          if (kids.length === 1 && kids[0].tagName === 'img') {
            const { src, alt, title } = kids[0].properties
            return (
              <figure className="entry-figure">
                <img src={assetUrl(slug, src)} alt={alt || ''} loading="lazy" />
                {title && <figcaption>{title}</figcaption>}
              </figure>
            )
          }
          return <p>{content}</p>
        },

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
