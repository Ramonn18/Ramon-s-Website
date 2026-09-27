import { Link, NavLink } from 'react-router'
import monogram from './assets/monogram.svg'
import { NAV_LEFT, NAV_RIGHT } from './nav.js'

function NavGroup({ items, side }) {
  return (
    <ul className={`site-header__nav site-header__nav--${side}`}>
      {items.map((item) => (
        <li key={item.to}>
          <NavLink className="nav__link" to={item.to}>
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

// Monogram centered with two buttons either side, as on the Home screen.
export default function SiteHeader() {
  return (
    <header className="site-header">
      <nav className="site-header__menu" aria-label="Main">
        <NavGroup items={NAV_LEFT} side="left" />

        <Link to="/" className="site-header__home" aria-label="Home">
          <img src={monogram} alt="" width="312" height="322" />
        </Link>

        <NavGroup items={NAV_RIGHT} side="right" />
      </nav>
    </header>
  )
}
