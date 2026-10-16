import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import '../css/navbar.css'

const links = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/actividades', label: 'Actividades' },
  { to: '/registro', label: 'Quiero participar' },
  { to: '/lista', label: 'Inscripciones' },
]

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  function navLinkClass({ isActive }) {
    return `nav-link${isActive ? ' active' : ''}`
  }

  function renderLinks(mobile = false) {
    return links.map(({ to, label, end }) => {
      const closeMenu = mobile ? () => setMenuOpen(false) : undefined

      return (
        <NavLink
          key={label}
          to={to}
          end={end}
          className={navLinkClass}
          onClick={closeMenu}
        >
          {label}
        </NavLink>
      )
    })
  }

  return (
    <>
      <svg className="svg-definitions" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <symbol id="icon-heart" viewBox="0 0 24 24">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
        </symbol>
        <symbol id="icon-menu" viewBox="0 0 24 24">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </symbol>
      </svg>

      <header className="site-header">
        <div className="container header-content">
          <Link className="brand" to="/" aria-label="Sumamos, inicio">
            <span className="brand-icon">
              <svg className="icon" aria-hidden="true">
                <use href="#icon-heart" />
              </svg>
            </span>
            <span className="brand-name">Sumamos</span>
          </Link>

          <nav className="main-nav" aria-label="Navegación principal">
            {renderLinks()}
          </nav>

          <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg className="icon" aria-hidden="true">
              <use href="#icon-menu" />
            </svg>
          </button>
        </div>

        {menuOpen && (
          <nav className="mobile-nav container" aria-label="Navegación móvil">
            {renderLinks(true)}
          </nav>
        )}
      </header>
    </>
  )
}

export default Navbar
