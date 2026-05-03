'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  variant: ToastVariant;
  title: string;
  message?: string;
  leaving?: boolean;
}

interface ToastContextValue {
  toast: (variant: ToastVariant, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

const ICONS: Record<ToastVariant, string> = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 260);
  }, []);

  const toast = useCallback((variant: ToastVariant, title: string, message?: string) => {
    const id = ++counterRef.current;
    setToasts(prev => [...prev, { id, variant, title, message }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-container" role="region" aria-label="Notificaciones" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.variant}${t.leaving ? ' toast-leaving' : ''}`}>
            <span className="toast-icon">{ICONS[t.variant]}</span>
            <div className="toast-body">
              <div className="toast-title">{t.title}</div>
              {t.message && <div className="toast-msg">{t.message}</div>}
            </div>
            <button className="toast-close" onClick={() => remove(t.id)} aria-label="Cerrar">✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
