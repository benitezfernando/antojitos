'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Desregistrar todos los SW viejos y limpiar todos los caches
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((reg) => reg.unregister());
    });
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    });

    // Registrar el SW nuevo
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.error('[SW] Error al registrar:', err));
  }, []);

  return null;
}
