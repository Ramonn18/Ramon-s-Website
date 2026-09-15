import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react'
import SheetMarks from '../SheetMarks.jsx'
import SiteHeader from '../SiteHeader.jsx'
import Markdown from './Markdown.jsx'
import { formatDate, getPost, posts } from './posts.js'
import './blog.css'

// Progress starts when the article reaches this far from the top of the window
const READING_START_OFFSET = 140

function ArrowIcon({ direction = 'left' }) {
  return (
    <svg
      className={`arrow-icon arrow-icon--${direction}`}
      width="16"
      height="10"
      viewBox="0 0 16 10"
      aria-hidden="true"
    >
      <path d="M15 5H1M5 1L1 5l4 4" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

// START → END rail beside the entry: fills as you read, with a tick at each
// section heading. On narrow screens it becomes a bar across the top.
function ReadingProgress({ articleRef }) {
  const { scrollYProgress } = useScroll({
    target: articleRef,
    offset: [`start ${READING_START_OFFSET}px`, 'end end'],
  })
  const markerTop = useTransform(scrollYProgress, (value) => `${value * 100}%`)
  const [ticks, setTicks] = useState([])
  const [progress, setProgress] = useState(0)

  useMotionValueEvent(scrollYProgress, 'change', (value) => setProgress(Math.round(value * 200) / 200))

  // Where each heading sits along the rail, in the same 0–1 range as the scroll progress
  useEffect(() => {
    const article = articleRef.current
    if (!article) return

    const measure = () => {
      const articleTop = article.getBoundingClientRect().top + window.scrollY
      const range = Math.max(1, article.offsetHeight - window.innerHeight + READING_START_OFFSET)
      const headings = article.querySelectorAll('.entry__body h2, .entry__body h3')
      setTicks(
        [...headings].map((heading, index) => ({
          id: index,
          at: Math.min(1, Math.max(0, (heading.getBoundingClientRect().top + window.scrollY - articleTop) / range)),
        })),
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(article)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [articleRef])

  return (
    <>
      <div className="reading-progress" aria-hidden="true">
        <span className="reading-progress__label">START</span>
        <div className="reading-progress__rail">
          <motion.span className="reading-progress__fill" style={{ scaleY: scrollYProgress }} />
          {ticks.map((tick) => (
            <span
              key={tick.id}
              className="reading-progress__tick"
              data-passed={progress >= tick.at || undefined}
              style={{ top: `${tick.at * 100}%` }}
            />
          ))}
          <motion.span className="reading-progress__marker" style={{ top: markerTop }} />
        </div>
        <span className="reading-progress__label">END</span>
      </div>
      <motion.div className="reading-progress-bar" style={{ scaleX: scrollYProgress }} aria-hidden="true" />
    </>
  )
}

function NotFound() {
  return (
    <div className="sheet">
      <SheetMarks label="BLOG" details={['404']} />
      <div className="page">
        <SiteHeader />
        <main className="entry-missing">
          <h1 className="entry__title">Entry not found</h1>
          <p>This entry doesn&apos;t exist, or it hasn&apos;t been published yet.</p>
          <Link className="text-link" to="/blog">
            <ArrowIcon /> All entries
          </Link>
        </main>
      </div>
    </div>
  )
}

export default function BlogPost() {
  const { slug } = useParams()
  const post = getPost(slug)
  const articleRef = useRef(null)

  useEffect(() => {
    document.title = post ? `${post.title} — Ramon Naula` : 'Entry not found — Ramon Naula'
  }, [post])

  if (!post) return <NotFound />

  const index = posts.indexOf(post)
  const newer = posts[index - 1]
  const older = posts[index + 1]

  return (
    <div className="sheet">
      <SheetMarks
        label={`ENTRY ${post.number}`}
        details={post.phase ? [post.phase.toUpperCase()] : []}
      />

      <div className="page">
        <SiteHeader />

        <main>
          <Link className="text-link entry__back" to="/blog">
            <ArrowIcon /> All entries
          </Link>

          <article className="entry" ref={articleRef}>
            <ReadingProgress articleRef={articleRef} />

            <header className="entry__header">
              <hr className="entry__rule" />
              <div className="entry__tags">
                <span className="pill">Entry {post.number}</span>
                {post.phase && <span className="pill">{post.phase}</span>}
                <time className="pill" dateTime={post.date}>
                  {formatDate(post.date)}
                </time>
                {post.draft && <span className="pill pill--draft">Draft · not on the live site</span>}
              </div>
              <h1 className="entry__title">{post.title}</h1>
              {post.summary && <p className="entry__summary">{post.summary}</p>}
            </header>

            <div className="entry__body">
              <Markdown slug={post.slug}>{post.body}</Markdown>
            </div>
          </article>

          {(older || newer) && (
            <nav className="entry-pager" aria-label="More entries">
              {older ? (
                <Link className="entry-pager__link" to={`/blog/${older.slug}`}>
                  <span className="entry-pager__label">
                    <ArrowIcon /> Previous entry
                  </span>
                  <span className="entry-pager__title">{older.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {newer && (
                <Link className="entry-pager__link entry-pager__link--next" to={`/blog/${newer.slug}`}>
                  <span className="entry-pager__label">
                    Next entry <ArrowIcon direction="right" />
                  </span>
                  <span className="entry-pager__title">{newer.title}</span>
                </Link>
              )}
            </nav>
          )}
        </main>
      </div>
    </div>
  )
}
