'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/',            label: 'Dashboard',          icon: '◈' },
  { href: '/insumos',     label: 'Materias Primas',    icon: '⬡' },
  { href: '/recetas',     label: 'Recetas y Productos', icon: '◎' },
  { href: '/produccion',  label: 'Producción y Ventas', icon: '◆' },
  { href: '/configuracion', label: 'Acerca de',        icon: '○' },
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
          width={30}
          height={30}
          style={{ borderRadius: '50%', objectFit: 'cover' }}
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
            width={40}
            height={40}
            style={{ borderRadius: '50%', objectFit: 'cover' }}
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
              <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">v1.0.0 · Next.js 16</div>
      </aside>
    </>
  );
}
