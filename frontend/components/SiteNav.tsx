'use client'

import { useState } from 'react'

const navLinks = [
  { href: '/services', label: 'Services' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/estimate', label: 'Start Estimate' },
  { href: '/status', label: 'Check Status' },
  { href: '/contact', label: 'Contact' },
  { href: '/admin', label: 'Shop Login' },
]

export default function SiteNav() {
  const [open, setOpen] = useState(false)

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
      </div>
    </nav>
  )
}
