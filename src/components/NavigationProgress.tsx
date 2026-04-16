'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // Primera carga — no mostrar
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;

    // Página nueva cargó — completar y ocultar
    setWidth(100);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  // Interceptar clicks en links para iniciar la barra
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#') || href === pathname) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      setVisible(true);
      setWidth(0);

      // Animar hasta ~85% mientras espera la respuesta del servidor
      let current = 0;
      const animate = () => {
        current = current < 30 ? current + 8 : current < 60 ? current + 3 : current < 85 ? current + 0.8 : current;
        setWidth(Math.min(current, 85));
        if (current < 85) rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
    };

    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '3px',
      zIndex: 9999,
      pointerEvents: 'none',
    }}>
      <div style={{
        height: '100%',
        width: `${width}%`,
        background: 'linear-gradient(90deg, var(--primary), var(--accent))',
        transition: width === 100 ? 'width 0.2s ease' : 'width 0.1s ease',
        borderRadius: '0 2px 2px 0',
        boxShadow: '0 0 8px rgba(141, 110, 99, 0.6)',
      }} />
    </div>
  );
}
