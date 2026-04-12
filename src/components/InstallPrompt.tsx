'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setVisible(false);
    setDeferredPrompt(null);
  }

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      background: 'var(--surface-color)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid var(--glass-border)',
      borderRadius: '14px',
      padding: '1rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      maxWidth: 'calc(100vw - 2rem)',
      width: '360px',
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/ico.jpeg" alt="Antojitos" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.1rem' }}>Instalar Antojitos</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>Agregá la app a tu pantalla de inicio</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
        <button
          onClick={handleInstall}
          className="btn btn-primary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          Instalar
        </button>
        <button
          onClick={() => setVisible(false)}
          style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}
