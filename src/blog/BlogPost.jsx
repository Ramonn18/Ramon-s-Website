import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { motion, useScroll, useTransform } from 'motion/react'
import SheetMarks from '../SheetMarks.jsx'
import SiteHeader from '../SiteHeader.jsx'
import Markdown from './Markdown.jsx'
import { formatDate, getPost, posts } from './posts.js'
import './blog.css'

// Morse for "SCROLL", from the case-study frame's ink pill in Figma
const MORSE_SCROLL = '... -.-. .-. --- .-.. .-..'

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

// The pill's arrow travels down as you read
function ReadingCue() {
  const { scrollYProgress } = useScroll()
  const arrowTop = useTransform(scrollYProgress, [0, 1], ['220px', '410px'])

  return (
    <div className="reading-cue" aria-hidden="true">
      <span className="reading-cue__morse">{MORSE_SCROLL}</span>
      <motion.svg
        className="reading-cue__arrow"
        style={{ top: arrowTop }}
        width="8"
        height="17"
        viewBox="0 0 8 17"
      >
        <path d="M4 0v15.5M1 12.5l3 3.5 3-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </motion.svg>
    </div>
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

          <article className="entry">
            <ReadingCue />

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
