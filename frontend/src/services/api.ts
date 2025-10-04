import type { Proyecto } from "../types/proyecto";
import type { Tarea } from "../types/tarea";
import type { Estado } from "../types/estado";
import type {
  CreateProyectoDTO,
  UpdateProyectoDTO,
  CreateTareaDTO,
  UpdateTareaDTO,
  MoveTareaDTO,
} from "../types/api";
import type { ChatMessage } from "../types/chats";
import type { Paginated } from "../types/common";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const isProd = import.meta.env.MODE === "production";
const base = isProd && import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : "";

function toQuery(params?: Record<string, unknown>): string {
  if (!params) return "";
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue;
    if (Array.isArray(v)) v.forEach((vv) => q.append(k, String(vv)));
    else q.append(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && init.body != null) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${base}${path}`, {
    credentials: "include",
    ...init,
    headers,
  });

  if (res.status === 204) return undefined as T;

  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    throw new ApiError(typeof body === "string" ? body : JSON.stringify(body), res.status);
  }
  return body as T;
}

const http = {
  get:   <T>(path: string, params?: Record<string, unknown>) => request<T>(`${path}${toQuery(params)}`),
  post:  <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: body == null ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: body == null ? undefined : JSON.stringify(body) }),
  delete:<T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export const api = {
  /** Proyectos */
  listProyectos: (params?: { q?: string; page?: number; pageSize?: number }) =>
    http.get<Paginated<Proyecto>>("/api/proyectos", params),

  getProyecto: (id: string) => http.get<Proyecto>(`/api/proyectos/${encodeURIComponent(id)}`),

  createProyecto: (dto: CreateProyectoDTO) => http.post<Proyecto>("/api/proyectos", dto),

  updateProyecto: (id: string, dto: UpdateProyectoDTO) =>
    http.patch<Proyecto>(`/api/proyectos/${encodeURIComponent(id)}`, dto),

  deleteProyecto: (id: string) => http.delete<void>(`/api/proyectos/${encodeURIComponent(id)}`),

  addUsuarioAProyecto: (proyectoId: string, usuario: string) =>
    http.post<void>(`/api/proyectos/${encodeURIComponent(proyectoId)}/usuarios`, { usuario }),

  removeUsuarioDeProyecto: (proyectoId: string, usuario: string) =>
    http.delete<void>(
      `/api/proyectos/${encodeURIComponent(proyectoId)}/usuarios/${encodeURIComponent(usuario)}`
    ),

  /** Tareas */
  createTarea: (proyectoId: string, estado: Estado, dto: CreateTareaDTO) =>
    http.post<Tarea>(`/api/proyectos/${encodeURIComponent(proyectoId)}/tareas`, { ...dto, estado }),

  updateTarea: (proyectoId: string, tareaId: string, dto: UpdateTareaDTO) =>
    http.patch<Tarea>(
      `/api/proyectos/${encodeURIComponent(proyectoId)}/tareas/${encodeURIComponent(tareaId)}`,
      dto
    ),

  // Mover tarea — el backend acepta to/destino/estado (usamos destino para ser explícitos)
  moveTarea: (proyectoId: string, payload: MoveTareaDTO) => {
    const body: Record<string, unknown> = {
      tareaId: payload.tareaId,
      destino: payload.to,
    };
    if (payload.from) body.origen = payload.from;
    if (typeof payload.index === "number") body.index = payload.index;

    return http.post<Proyecto>(
      `/api/proyectos/${encodeURIComponent(proyectoId)}/tareas/move`,
      body
    );
  },

  deleteTarea: (proyectoId: string, tareaId: string) =>
    http.delete<void>(
      `/api/proyectos/${encodeURIComponent(proyectoId)}/tareas/${encodeURIComponent(tareaId)}`
    ),

  /** Chat */
  getChatHistory: async (proyectoId: string, params?: { page?: number; pageSize?: number }) => {
    const res = await http.get<any>(`/api/proyectos/${encodeURIComponent(proyectoId)}/chat`, params);
    if (Array.isArray(res)) return res as ChatMessage[];
    if (Array.isArray(res?.items)) return res.items as ChatMessage[];
    if (Array.isArray(res?.data)) return res.data as ChatMessage[];
    return [] as ChatMessage[];
  },

  sendChatMessage: (proyectoId: string, sender: string, text: string) =>
    http.post<ChatMessage>(`/api/proyectos/${encodeURIComponent(proyectoId)}/chat`, {
      sender,
      text,
    }),
};

// --- Auth ---

// TIPOS
export type RegisterPayload = {
  email: string;
  password: string;
  name?: string;
  avatarUrl?: string;
  birthdate?: string; // yyyy-mm-dd
  jobTitle?: string;
  phone?: string;
};

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
};

// AUTH API
// ...
export const authApi = {
  register: (payload: RegisterPayload) =>
    http.post<{ ok: true }>("/api/auth/register", payload),

  login: (email: string, password: string) =>
    http.post<{ email: string; name?: string | null; avatarUrl?: string | null }>(
      "/api/auth/login",
      { email, password }
    ),

  // ⬇️ si 401 => devuelve null en vez de lanzar
  me: async () => {
    try {
      return await http.get<SessionUser>("/api/auth/me");
    } catch (e: any) {
      if (e?.status === 401) return null;
      throw e;
    }
  },

  logout: () => http.post<void>("/api/auth/logout"),
};


