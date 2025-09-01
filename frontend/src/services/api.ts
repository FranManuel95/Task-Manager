export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, init);
  if (!res.ok) throw new Error(`[GET ${path}] ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

async function send<T>(
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...init,
  });
  if (!res.ok) throw new Error(`[${method} ${path}] ${res.status} ${res.statusText}`);
  return (method === 'DELETE' ? (undefined as unknown as T) : (res.json() as Promise<T>));
}

export const apiPost  =  <T>(path: string, body: unknown, init?: RequestInit) => send<T>(path, 'POST',  body,  init);
export const apiPatch =  <T>(path: string, body: unknown, init?: RequestInit) => send<T>(path, 'PATCH', body,  init);
export const apiDelete =    (path: string,                      init?: RequestInit) => send<void>(path, 'DELETE',undefined,init);
