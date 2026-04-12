'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: '🏠 Dashboard' },
  { href: '/insumos', label: '🥄 Materias Primas' },
  { href: '/recetas', label: '📋 Recetas y Productos' },
  { href: '/configuracion', label: '⚙️ Configuración' },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <button className="hamburger-btn" onClick={() => setOpen(true)} aria-label="Abrir menú">
          <span /><span /><span />
        </button>
        <Image
          src="/ico.jpeg"
          alt="Antojitos"
          width={36}
          height={36}
          style={{ borderRadius: '50%', objectFit: 'cover' }}
        />
        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>Antojitos</span>
      </div>

      {/* Overlay when sidebar open on mobile */}
      {open && (
        <div className="sidebar-overlay" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <Image
            src="/ico.jpeg"
            alt="Antojitos"
            width={80}
            height={80}
            style={{ borderRadius: '50%', objectFit: 'cover', display: 'block', margin: '0 auto 0.75rem' }}
            priority
          />
          <span>Antojitos Admin</span>
        </div>

        <nav className="sidebar-nav">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-item ${pathname === link.href ? 'nav-item-active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>v1.0.0</p>
          <button
            className="hamburger-close"
            onClick={() => setOpen(false)}
            style={{ display: 'none' }}
            aria-label="Cerrar menú"
          >
            ✕ Cerrar
          </button>
        </div>
      </aside>
    </>
  );
}
