'use client'

import { useEffect, useState } from 'react'
import { getStoredShopUser } from '../lib/shopAuth'

const navLinks = [
  { href: '/services', label: 'Services' },
  { href: '/areas', label: 'Service Areas' },
  { href: '/products', label: 'Products' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/estimate', label: 'Start Estimate' },
  { href: '/status', label: 'Check Status' },
  { href: '/contact', label: 'Contact' },
]

export default function SiteNav() {
  const [open, setOpen] = useState(false)
  const [shopLoggedIn, setShopLoggedIn] = useState(false)

  useEffect(() => {
    function syncShopSession() {
      setShopLoggedIn(Boolean(getStoredShopUser()))
    }

    syncShopSession()
    window.addEventListener('storage', syncShopSession)
    window.addEventListener('focus', syncShopSession)
    window.addEventListener('hanks-paints-shop-session', syncShopSession)

    return () => {
      window.removeEventListener('storage', syncShopSession)
      window.removeEventListener('focus', syncShopSession)
      window.removeEventListener('hanks-paints-shop-session', syncShopSession)
    }
  }, [])

  return (
    <nav className="nav">
      <a className="brand" href="/" onClick={() => setOpen(false)}>
        HANKS <span className="accent">PAINTS</span>
      </a>

      <button
        className="menu-button"
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span />
        <span />
        <span />
      </button>

      <div className={`links ${open ? 'open' : ''}`}>
        {navLinks.map((link) => (
          <a href={link.href} key={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </a>
        ))}
        {shopLoggedIn ? (
          <div className="nav-admin-group">
            <a href="/admin" onClick={() => setOpen(false)}>
              Admin Page
            </a>
            <a className="nav-sub-link" href="/admin/calendar" onClick={() => setOpen(false)}>
              Shop Calendar
            </a>
            <a className="nav-sub-link" href="/admin/workflow" onClick={() => setOpen(false)}>
              Workflow Map
            </a>
          </div>
        ) : (
          <a href="/admin" onClick={() => setOpen(false)}>
            Shop Login
          </a>
        )}
      </div>
    </nav>
  )
}
