import { Link, NavLink } from 'react-router'
import monogram from './assets/monogram.svg'
import { NAV_LEFT, NAV_RIGHT } from './nav.js'

export default function SiteHeader() {
  return (
    <header className="site-header">
      <Link to="/" className="site-header__home" aria-label="Home">
        <img src={monogram} alt="" width="312" height="322" />
      </Link>
      <nav aria-label="Main">
        <ul className="site-header__nav">
          {[...NAV_LEFT, ...NAV_RIGHT].map((item) => (
            <li key={item.to}>
              <NavLink className="nav__link" to={item.to}>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
