import { useEffect } from 'react'
import { useLocation } from 'react-router'

// Start each new page at the top (hash links on the same page are left alone)
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
