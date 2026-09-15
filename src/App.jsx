import { useEffect, useState } from 'react'
import { MotionConfig, motion, useReducedMotion } from 'motion/react'
import monogram from './assets/monogram.svg'
import loadingAnimation from './assets/loading.gif'
import './App.css'

// Timings and curves from the Figma prototype ("Refined Prototype" page)
const LOADING_MS = 1850
const INTRO = { duration: 0.6, ease: [0, 0, 0.58, 1] }
const REVEAL = { type: 'spring', mass: 1, stiffness: 80, damping: 20 }
const INSTANT = { duration: 0 }

const NAV_LEFT = [
  { label: 'Ux/Ui projects', href: '#ux-ui-projects' },
  { label: 'Design', href: '#design' },
]

const NAV_RIGHT = [
  { label: 'About me', href: '#about' },
  { label: 'Contact me', href: '#contact' },
]

const CORNERS = ['tl', 'tr', 'bl', 'br']

function MetaRow({ position, collapsed }) {
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
        <span>1.78:1</span>
        <span>{'16”  ×   9”'}</span>
      </motion.span>
    </motion.p>
  )
}

function NavGroup({ items, side, open }) {
  return (
    <ul className={`nav nav--${side}`} data-collapsed={open ? undefined : true}>
      {items.map((item) => (
        <motion.li
          key={item.href}
          layout
          className="nav__item"
          initial={false}
          animate={{ opacity: open ? 1 : 0 }}
        >
          <a className="nav__link" href={item.href} tabIndex={open ? undefined : -1}>
            {item.label}
          </a>
        </motion.li>
      ))}
    </ul>
  )
}

export default function App() {
  const reduceMotion = useReducedMotion()
  const [phase, setPhase] = useState('loading') // loading → intro ⇄ open
  const [hasToggled, setHasToggled] = useState(false)

  useEffect(() => {
    if (phase !== 'loading') return
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

        <MetaRow position="top" collapsed={loading} />
        <MetaRow position="bottom" collapsed={loading} />

        <nav className="hub" aria-label="Main">
          <NavGroup items={NAV_LEFT} side="left" open={open} />

          <motion.button
            type="button"
            className="mark"
            onClick={toggleNav}
            disabled={loading}
            aria-expanded={open}
            aria-label={open ? 'Hide menu' : 'Show menu'}
            initial={false}
            animate={{ opacity: loading ? 0 : 1 }}
          >
            <img src={monogram} alt="" width="312" height="322" />
          </motion.button>

          <NavGroup items={NAV_RIGHT} side="right" open={open} />
        </nav>
      </motion.main>
    </MotionConfig>
  )
}
