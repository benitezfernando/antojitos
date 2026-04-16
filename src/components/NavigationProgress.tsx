'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;

    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#') || href === pathname) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      setVisible(true);
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [pathname]);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes nav-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.45)',
        backdropFilter: 'blur(3px)',
        pointerEvents: 'none',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: '4px solid rgba(141,110,99,0.2)',
          borderTopColor: 'var(--primary)',
          animation: 'nav-spin 0.75s linear infinite',
        }} />
      </div>
    </>
  );
}
