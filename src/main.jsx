import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import '@fontsource-variable/inter'
// The entry lede is Medium Italic in Figma, and font-synthesis is off
import '@fontsource-variable/inter/wght-italic.css'
import './index.css'
import './sheet.css'
import App from './App.jsx'
import ScrollToTop from './ScrollToTop.jsx'

// The blog pulls in react-markdown, remark-gfm and every entry's text. Home
// never renders any of it, so it loads on demand instead of in the main bundle.
const BlogIndex = lazy(() => import('./blog/BlogIndex.jsx'))
const BlogPost = lazy(() => import('./blog/BlogPost.jsx'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ScrollToTop />
      {/* A bare sheet while a route arrives, so the cream never flashes white */}
      <Suspense fallback={<div className="sheet" />}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/blog" element={<BlogIndex />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
)
