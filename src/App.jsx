import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { MotionConfig, motion, useReducedMotion } from 'motion/react'
import monogram from './assets/monogram.svg'
import loadingAnimation from './assets/loading.gif'
import { NAV_LEFT, NAV_RIGHT } from './nav.js'
import './App.css'

// Timings and curves from the Figma prototype ("Refined Prototype" page)
const LOADING_MS = 1850
const INTRO = { duration: 0.6, ease: [0, 0, 0.58, 1] }
const REVEAL = { type: 'spring', mass: 1, stiffness: 80, damping: 20 }
const INSTANT = { duration: 0 }

// A button's travel: quick and firm, not the springy curve the menu uses.
const PRESS = { type: 'spring', stiffness: 420, damping: 32 }
// Halfway down on hover, the rest of the way on press, and it stays down
// while the menu it opened is showing.
const BUTTON = {
  raised: { scale: 1, y: 0 },
  half: { scale: 0.97, y: 3 },
  pressed: { scale: 0.94, y: 6 },
}
// The menu ripples out from the monogram: the pair beside it (Design, About
// me) fades in first, then the outer pair. Each link rises into place and
// overshoots a touch, the bounce. Closing runs the ripple backwards.
const RIPPLE = 0.08
const RISE = 10
const BOUNCE = { type: 'spring', stiffness: 260, damping: 11, mass: 0.8 }
const FADE_OUT = { duration: 0.18, ease: [0.4, 0, 1, 1] }

const CORNERS = ['tl', 'tr', 'bl', 'br']

// Remembered for this page load only: coming back from another page skips
// the intro and shows the open menu, while a refresh replays it.
let introPlayed = false

// The sheet's edge labels describe the window they are being read in, so they
// track the viewport rather than quoting the 1440 x 900 Figma frame.
// Resize fires continuously, so updates are coalesced to one a frame.
function useViewportLabels() {
  const read = () => ({ w: Math.round(window.innerWidth), h: Math.round(window.innerHeight) })
  const [{ w, h }, setSize] = useState(read)

  useEffect(() => {
    let frame = 0
    const onResize = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setSize(read()))
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return {
    // Landscape reads "1.78:1", portrait flips to "1:1.78" rather than "0.56:1"
    ratio: w >= h ? `${(w / h).toFixed(2)}:1` : `1:${(h / w).toFixed(2)}`,
    size: `${w} × ${h}`,
  }
}

function MetaRow({ position, collapsed, ratio, size }) {
  return (
    <motion.p
      layout
      className={`meta meta--${position}`}
      data-collapsed={collapsed || undefined}
      style={position === 'bottom' ? { rotate: 180 } : undefined}
      initial={false}
      animate={{ opacity: collapsed ? 0 : 1 }}
      aria-hidden="true"
    >
      <motion.span layout className="meta__start">RAMON NOIR</motion.span>
      <motion.span layout>WEB PAGE</motion.span>
      <motion.span layout className="meta__end">
        <span>{ratio}</span>
        <span>{size}</span>
      </motion.span>
    </motion.p>
  )
}

function NavGroup({ items, side, open, reduceMotion }) {
  const rings = items.length
  return (
    <ul className={`nav nav--${side}`} data-collapsed={open ? undefined : true}>
      {items.map((item, index) => {
        // Ring 0 sits next to the monogram; the left list runs toward it
        const ring = side === 'left' ? rings - 1 - index : index
        const transition = reduceMotion
          ? INSTANT
          : open
            ? {
                y: { ...BOUNCE, delay: ring * RIPPLE },
                opacity: { duration: 0.3, ease: 'easeOut', delay: ring * RIPPLE },
              }
            : { ...FADE_OUT, delay: (rings - 1 - ring) * RIPPLE * 0.5 }
        return (
          <motion.li
            key={item.to}
            className="nav__item"
            initial={false}
            animate={{ opacity: open ? 1 : 0, y: open || reduceMotion ? 0 : RISE }}
            transition={transition}
          >
            <Link className="nav__link" to={item.to} tabIndex={open ? undefined : -1}>
              {item.label}
            </Link>
          </motion.li>
        )
      })}
    </ul>
  )
}

export default function App() {
  const reduceMotion = useReducedMotion()
  const { ratio, size } = useViewportLabels()
  const [phase, setPhase] = useState(() => (introPlayed ? 'open' : 'loading')) // loading → intro ⇄ open
  const [hasToggled, setHasToggled] = useState(introPlayed)

  useEffect(() => {
    document.title = 'Ramon Naula'
  }, [])

  useEffect(() => {
    if (phase !== 'loading') {
      introPlayed = true
      return
    }
    const timer = setTimeout(() => setPhase('intro'), reduceMotion ? 0 : LOADING_MS)
    return () => clearTimeout(timer)
  }, [phase, reduceMotion])

  const loading = phase === 'loading'
  const open = phase === 'open'
  const transition = reduceMotion ? INSTANT : hasToggled ? REVEAL : INTRO

  const toggleNav = () => {
    setHasToggled(true)
    setPhase(open ? 'intro' : 'open')
  }

  return (
    <MotionConfig transition={transition}>
      <motion.main
        className="stage"
        aria-busy={loading}
        initial={false}
        animate={{ backgroundColor: loading ? '#1a1a1a' : '#e8e8e1' }}
      >
        <motion.img
          className="loader"
          src={loadingAnimation}
          alt=""
          initial={false}
          animate={{ opacity: loading ? 1 : 0 }}
        />

        {CORNERS.map((corner) => (
          <motion.span
            key={corner}
            layout
            className={`crosshair crosshair--${corner}`}
            data-collapsed={loading || undefined}
            initial={false}
            animate={{ opacity: loading ? 0 : 1 }}
            aria-hidden="true"
          />
        ))}

        <MetaRow position="top" collapsed={loading} ratio={ratio} size={size} />
        <MetaRow position="bottom" collapsed={loading} ratio={ratio} size={size} />

        <nav className="hub" aria-label="Main">
          <NavGroup items={NAV_LEFT} side="left" open={open} reduceMotion={reduceMotion} />

          <motion.button
            type="button"
            className="mark"
            onClick={toggleNav}
            disabled={loading}
            aria-expanded={open}
            aria-label={open ? 'Hide menu' : 'Show menu'}
            initial={false}
            animate={{
              opacity: loading ? 0 : 1,
              ...(reduceMotion ? {} : open ? BUTTON.half : BUTTON.raised),
            }}
            whileHover={loading || reduceMotion ? undefined : { ...BUTTON.half, transition: PRESS }}
            whileTap={loading || reduceMotion ? undefined : { ...BUTTON.pressed, transition: PRESS }}
          >
            <img src={monogram} alt="" width="312" height="322" />
          </motion.button>

          <NavGroup items={NAV_RIGHT} side="right" open={open} reduceMotion={reduceMotion} />
        </nav>
      </motion.main>
    </MotionConfig>
  )
}
