'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Limpiar TODOS los service workers y caches registrados UNA sola vez.
    // La app es 100% dinámica — no queremos SW activo en ningún momento.
    const cleanup = async () => {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length > 0) {
        await Promise.all(registrations.map((reg) => reg.unregister()));
      }
    };

    cleanup();
  }, []);

  return null;
}
