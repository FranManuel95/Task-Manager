// frontend/src/services/api.ts
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const isProd = import.meta.env.MODE === "production";
const base = isProd && import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    // Si NO usas cookies/sesiones, quita la línea de abajo:
    credentials: "include",
    ...init,
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : await res.text();
  if (!res.ok) throw new ApiError(typeof body === "string" ? body : JSON.stringify(body), res.status);
  return body as T;
}

export const api = {
  health: () => request<{ ok: boolean; ts: number; env?: string }>("/api/health"),
  listTodos: () => request<Array<{ id: number; title: string; done: boolean }>>("/api/todos"),
  createTodo: (title: string) =>
    request<{ id: number; title: string; done: boolean }>("/api/todos", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),
};
