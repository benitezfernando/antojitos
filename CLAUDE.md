@AGENTS.md

# AntojitosAdmin — Documentación del proyecto

## Arquitectura

Este repo es **solo el frontend**. El backend es un proyecto separado (`antojitos-go`, API REST en Go 1.22 con arquitectura hexagonal).

- **Frontend**: Next.js 16 + React 19 + TypeScript + Tailwind CSS → deployado en **Vercel**
- **Backend**: Go 1.22 + Gin v1.10 + Google Sheets como DB → deployado en **Railway**
- Comunicación: el frontend consume la API via `apiFetch<T>()` apuntando a `NEXT_PUBLIC_API_URL`

## Archivos clave

| Archivo | Propósito |
|---------|-----------|
| `src/lib/api-client.ts` | Cliente HTTP genérico. `apiFetch<T>(path, init?)` maneja el envelope `{ success, data, error }`. Lanza `APIError` con status HTTP. Base URL desde `NEXT_PUBLIC_API_URL` (fallback: `http://localhost:8080`). |
| `src/lib/types.ts` | Interfaces TypeScript que espejean los DTOs del backend Go (snake_case). Fuente de verdad del contrato de API en el frontend. |

## Convenciones

- Todos los campos JSON son **snake_case** (matchean los struct tags de Go)
- Todas las respuestas siguen el envelope: `{ success: boolean, data?: T, error?: string }`
- Mutaciones usan `router.refresh()` post-fetch para invalidar el cache de Next.js (reemplaza `revalidatePath`)
- Componentes que hacen mutaciones son `'use client'` con `useState(loading)` — no usan `useTransition`
- Pages son Server Components que hacen fetch con `apiFetch` y pasan datos como props

## Contrato de API — campos clave

**Insumo** (GET response): `id, nombre, unidad_medida, costo_unitario, costo_paquete, cant_paquete, stock_actual, stock_minimo`
**Insumo** (POST/PUT body): `nombre, unidad_paquete, costo_paquete, cant_paquete, stock_actual, stock_minimo` — `costo_unitario` lo calcula el backend

**Producto** (GET response): incluye `receta[]` embebida. `margen_ganancia` llega como decimal (0.30). El frontend lo normaliza en `ProductoActions.tsx:66` — maneja tanto `0.30` como `30`.
**Producto** (POST/PUT body): `nombre, categoria, stock, margen_pct (entero), rinde_receta, ingredientes[]`

**Producción y Ventas**: el campo es `id_producto` (no `producto_id`) en las respuestas.

## Variables de entorno

```
NEXT_PUBLIC_API_URL=https://<nombre>.up.railway.app   # producción
NEXT_PUBLIC_API_URL=http://localhost:8080              # desarrollo local
```

## Dependencias eliminadas

Se removieron `google-spreadsheet` y `google-auth-library`. El frontend ya no tiene acceso directo a Google Sheets — toda esa lógica vive en el backend Go.

## Archivos eliminados

- `src/app/actions.ts` — server actions reemplazadas por `apiFetch`
- `src/lib/google-sheets.ts` — integración Sheets movida al backend
- `src/app/api/` — rutas API de Next.js eliminadas (init-db, seed-db, test-db)
- `src/proxy.ts`

## Deuda técnica

- `margen_ganancia` en el contrato de API debería estandarizarse a un solo formato (entero o decimal). Hoy el frontend tolera ambos como workaround.
- No hay manejo de autenticación/sesión en los endpoints del backend todavía.
