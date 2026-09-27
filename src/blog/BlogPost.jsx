import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { motion, useScroll, useTransform } from 'motion/react'
import SheetMarks from '../SheetMarks.jsx'
import SiteHeader from '../SiteHeader.jsx'
import SiteFooter from '../SiteFooter.jsx'
import Markdown from './Markdown.jsx'
import { formatDate, getPost, posts } from './posts.js'
import './blog.css'

// Progress starts when the article reaches this far from the top of the window
const READING_START_OFFSET = 140

// Figma draws this as a 21px line with an ARROW_LINES cap — an open V head.
// `length` stretches the shaft without changing the head.
function ArrowIcon({ direction = 'left', length = 16 }) {
  return (
    <svg
      className={`arrow-icon arrow-icon--${direction}`}
      width={length}
      height="10"
      viewBox={`0 0 ${length} 10`}
      aria-hidden="true"
    >
      <path
        d={`M${length - 1} 5H1M5 1L1 5l4 4`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  )
}

// Start → End rail beside the entry: a 1px track that a 2px line fills as you
// read, with a 17px tick at each section heading. Becomes a top bar on phones.
function ReadingProgress({ articleRef }) {
  const { scrollYProgress } = useScroll({
    target: articleRef,
    offset: [`start ${READING_START_OFFSET}px`, 'end end'],
  })
  const markerTop = useTransform(scrollYProgress, (value) => `${value * 100}%`)
  const [ticks, setTicks] = useState([])

  // Where each heading sits along the rail, in the same 0–1 range as the scroll
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
          at: Math.min(
            1,
            Math.max(
              0,
              (heading.getBoundingClientRect().top + window.scrollY - articleTop) / range,
            ),
          ),
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
        <span className="reading-progress__label">Start</span>
        <div className="reading-progress__rail">
          <motion.span className="reading-progress__fill" style={{ scaleY: scrollYProgress }} />
          {ticks.map((tick) => (
            <span
              key={tick.id}
              className="reading-progress__tick"
              style={{ top: `${tick.at * 100}%` }}
            />
          ))}
          <motion.span className="reading-progress__marker" style={{ top: markerTop }} />
        </div>
        <span className="reading-progress__label">End</span>
      </div>
      <motion.div
        className="reading-progress-bar"
        style={{ scaleX: scrollYProgress }}
        aria-hidden="true"
      />
    </>
  )
}

function NotFound() {
  return (
    <div className="sheet">
      <SheetMarks detail="Not found" />
      <div className="page">
        <SiteHeader />
        <main className="entry-missing">
          <h1 className="entry__title">Entry not found</h1>
          <p>This entry doesn&apos;t exist, or it hasn&apos;t been published yet.</p>
          <Link className="text-link" to="/blog">
            <ArrowIcon length={21} /> All entries
          </Link>
        </main>
        <SiteFooter />
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
      <SheetMarks detail={`Entry ${post.number}`} />

      <div className="page">
        <SiteHeader />

        <main>
          <article className="entry" ref={articleRef}>
            <Link className="text-link entry__back" to="/blog">
              <ArrowIcon length={21} /> Previous Blog
            </Link>

            <ReadingProgress articleRef={articleRef} />

            <header className="entry__header">
              <h1 className="entry__title">{post.title}</h1>

              <div className="entry__tags">
                {post.phase && <span className="pill">{post.phase}</span>}
                <time className="pill" dateTime={post.date}>
                  {formatDate(post.date)}
                </time>
                {post.draft && <span className="pill pill--draft">Draft · not on the live site</span>}
              </div>

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

        <SiteFooter />
      </div>
    </div>
  )
}
