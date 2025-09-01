export async function apiGet<T>(path: string): Promise<T> {
const res = await fetch(`/api${path}`);
if (!res.ok) throw new Error(`[GET ${path}] ${res.status} ${res.statusText}`);
return res.json();
}


export async function apiPost<T>(path: string, body: unknown): Promise<T> {
const res = await fetch(`/api${path}` , {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(body),
});
if (!res.ok) throw new Error(`[POST ${path}] ${res.status} ${res.statusText}`);
return res.json();
}


export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
const res = await fetch(`/api${path}`, {
method: 'PATCH',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(body),
});
if (!res.ok) throw new Error(`[PATCH ${path}] ${res.status} ${res.statusText}`);
return res.json();
}


export async function apiDelete(path: string): Promise<void> {
const res = await fetch(`/api${path}`, { method: 'DELETE' });
if (!res.ok) throw new Error(`[DELETE ${path}] ${res.status} ${res.statusText}`);
}