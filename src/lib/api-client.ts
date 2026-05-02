import type { APIResponse } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
const TENANT = process.env.NEXT_PUBLIC_TENANT ?? '';

export class APIError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  if (!TENANT) throw new APIError('NEXT_PUBLIC_TENANT no está definido', 500);

  const res = await fetch(`${BASE_URL}/api/v1/${TENANT}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
    ...init,
  });

  const body: APIResponse<T> = await res.json();

  if (!res.ok || !body.success) {
    throw new APIError(body.error ?? 'Error desconocido', res.status);
  }

  return body.data as T;
}
