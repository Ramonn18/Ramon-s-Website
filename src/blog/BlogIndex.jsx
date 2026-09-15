import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import SheetMarks from '../SheetMarks.jsx'
import SiteHeader from '../SiteHeader.jsx'
import { formatDate, phases, posts } from './posts.js'
import './blog.css'

const ALL = 'All'

export default function BlogIndex() {
  const reduceMotion = useReducedMotion()
  const [phase, setPhase] = useState(ALL)
  const visible = phase === ALL ? posts : posts.filter((post) => post.phase === phase)
  const count = `${posts.length} ${posts.length === 1 ? 'ENTRY' : 'ENTRIES'}`

  useEffect(() => {
    document.title = 'Blog — Ramon Naula'
  }, [])

  return (
    <div className="sheet">
      <SheetMarks label="BLOG" details={[count]} />

      <div className="page">
        <SiteHeader />

        <main>
          <section className="blog-intro">
            <h1 className="blog-intro__title">Blog</h1>
            <p className="blog-intro__lead">
              A process log documenting my thesis, entry by entry: research, concepts, prototypes and
              critiques.
            </p>
          </section>

          {phases.length > 1 && (
            <div className="phase-filter" role="group" aria-label="Filter entries by phase">
              {[ALL, ...phases].map((option) => (
                <button
                  key={option}
                  type="button"
                  className="pill pill--button"
                  aria-pressed={phase === option}
                  onClick={() => setPhase(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {posts.length === 0 ? (
            <p className="blog-empty">No entries published yet.</p>
          ) : (
            <ul className="entry-list">
              <AnimatePresence initial={false} mode="popLayout">
                {visible.map((post) => (
                  <motion.li
                    key={post.slug}
                    layout={!reduceMotion}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0, 0, 0.58, 1] }}
                  >
                    <Link className="entry-row" to={`/blog/${post.slug}`}>
                      <span className="entry-row__number">{post.number}</span>
                      <span className="entry-row__main">
                        <time className="entry-row__date" dateTime={post.date}>
                          {formatDate(post.date)}
                        </time>
                        <span className="entry-row__title">{post.title}</span>
                        {post.summary && <span className="entry-row__summary">{post.summary}</span>}
                      </span>
                      <span className="entry-row__tags">
                        {post.phase && <span className="pill">{post.phase}</span>}
                        {post.draft && <span className="pill pill--draft">Draft</span>}
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </main>
      </div>
    </div>
  )
}
