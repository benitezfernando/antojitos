const CACHE_NAME = 'antojitos-v2';

// Solo cachear assets verdaderamente estáticos (no páginas de la app)
const STATIC_ASSETS = [
  '/manifest.json',
  '/ico.jpeg',
];

// Instalar: precachear solo assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activar: limpiar caches viejos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first para todo (app dinámica con Google Sheets)
// Fallback a cache si no hay red
self.addEventListener('fetch', (event) => {
  // Solo interceptar requests del mismo origen y GET
  if (
    event.request.method !== 'GET' ||
    !event.request.url.startsWith(self.location.origin)
  ) {
    return;
  }

  // No interceptar requests de Next.js internos o Server Actions
  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  // Para navegación (páginas HTML): siempre network, nunca cache
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Solo cachear assets estáticos (imágenes, manifest)
        if (response.ok && !url.pathname.endsWith('.html')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Sin red: intentar desde cache solo para assets estáticos
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          return new Response('Sin conexión', { status: 503 });
        });
      })
  );
});
