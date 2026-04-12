'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Limpiar TODOS los service workers y caches registrados
    const cleanup = async () => {
      // 1. Borrar todos los caches
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }

      // 2. Desregistrar todos los SW existentes
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));

      // 3. Registrar el SW que se auto-mata (por si quedó uno viejo que no cargó aún)
      try {
        await navigator.serviceWorker.register('/sw-kill.js', { updateViaCache: 'none' });
      } catch {
        // ignorar — no es crítico
      }
    };

    cleanup();
  }, []);

  return null;
}
