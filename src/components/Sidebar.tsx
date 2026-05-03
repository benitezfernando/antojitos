'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/auth-actions';

const navLinks = [
  {
    href: '/',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="1" width="6" height="6" rx="1.5" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" />
      </svg>
    ),
  },
  {
    href: '/insumos',
    label: 'Materias Primas',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 1v14M1 8h14" />
        <circle cx="8" cy="8" r="5" />
      </svg>
    ),
  },
  {
    href: '/recetas',
    label: 'Recetas y Productos',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 2h8a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />
        <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" />
      </svg>
    ),
  },
  {
    href: '/produccion',
    label: 'Producción y Ventas',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12l4-4 3 3 5-6" />
        <path d="M11 6h3v3" />
      </svg>
    ),
  },
  {
    href: '/configuracion',
    label: 'Acerca de',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="2" />
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const close = () => setOpen(false);

  return (
    <>
      {/* Mobile topbar */}
      <div className="mobile-topbar">
        <button className="hamburger-btn" onClick={() => setOpen(true)} aria-label="Abrir menú">
          <span /><span /><span />
        </button>
        <Image
          src="/ico.jpeg"
          alt="Antojitos"
          width={28}
          height={28}
          style={{ borderRadius: '6px', objectFit: 'cover' }}
        />
        <span className="mobile-topbar-title">
          {navLinks.find(l => l.href === pathname)?.label ?? 'Antojitos'}
        </span>
      </div>

      {/* Overlay */}
      {open && <div className="sidebar-overlay" onClick={close} />}

      {/* Sidebar */}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>

        {/* Brand */}
        <div className="sidebar-brand">
          <Image
            src="/ico.jpeg"
            alt="Antojitos"
            width={38}
            height={38}
            style={{ borderRadius: '8px', objectFit: 'cover' }}
            priority
          />
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">Antojitos</span>
            <span className="sidebar-brand-sub">Panel de gestión</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-item ${pathname === link.href ? 'nav-item-active' : ''}`}
              onClick={close}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="nav-divider" />
        <form action={logout}>
          <button
            type="submit"
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.85rem', gap: '0.6rem' }}
            aria-label="Cerrar sesión"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5.5 1H2a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h3.5" />
              <path d="M10 10l3.5-3.5L10 3" />
              <path d="M13.5 6.5H5.5" />
            </svg>
            Cerrar sesión
          </button>
        </form>

        {/* Footer */}
        <div className="sidebar-footer" style={{ marginTop: '0.75rem' }}>v1.0.0</div>
      </aside>
    </>
  );
}
