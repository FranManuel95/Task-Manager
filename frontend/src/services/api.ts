// Cliente HTTP centralizado con endpoints tipados.
// Mantiene los endpoints de demo (/api/health, /api/todos) y añade proyectos/tareas/chat.

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
import type { ChatMessage, ChatMessageInput } from "../types/chats";
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
    if (v === undefined || v === null) continue;
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
    credentials: "include", // quita si no usas cookies/sesiones
    ...init,
    headers,
  });

  // 204 No Content
  if (res.status === 204) return undefined as T;

  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    throw new ApiError(typeof body === "string" ? body : JSON.stringify(body), res.status);
  }
  return body as T;
}

// Helpers semánticos
const http = {
  get: <T>(path: string, params?: Record<string, unknown>) => request<T>(`${path}${toQuery(params)}`),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body == null ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body == null ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body == null ? undefined : JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export const api = {
  /** -------------------- System / Demo -------------------- */
  health: () => http.get<{ ok: boolean; ts: number; env?: string }>("/api/health"),

  listTodos: () => http.get<Array<{ id: number; title: string; done: boolean }>>("/api/todos"),

  createTodo: (title: string) =>
    http.post<{ id: number; title: string; done: boolean }>("/api/todos", { title }),

  /** -------------------- Proyectos -------------------- */
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

  /** -------------------- Tareas -------------------- */
  createTarea: (proyectoId: string, estado: Estado, dto: CreateTareaDTO) =>
    http.post<Tarea>(`/api/proyectos/${encodeURIComponent(proyectoId)}/tareas`, {
      ...dto,
      estado,
    }),

  updateTarea: (proyectoId: string, tareaId: string, dto: UpdateTareaDTO) =>
    http.patch<Tarea>(
      `/api/proyectos/${encodeURIComponent(proyectoId)}/tareas/${encodeURIComponent(tareaId)}`,
      dto
    ),

  moveTarea: (proyectoId: string, payload: MoveTareaDTO) =>
    http.post<Proyecto>(`/api/proyectos/${encodeURIComponent(proyectoId)}/tareas/move`, payload),

  deleteTarea: (proyectoId: string, tareaId: string) =>
    http.delete<void>(
      `/api/proyectos/${encodeURIComponent(proyectoId)}/tareas/${encodeURIComponent(tareaId)}`
    ),

  /** -------------------- Chat -------------------- */
  getChatHistory: (proyectoId: string, params?: { page?: number; pageSize?: number }) =>
    http.get<Paginated<ChatMessage>>(
      `/api/proyectos/${encodeURIComponent(proyectoId)}/chat`,
      params
    ),

  sendChatMessage: (input: ChatMessageInput) =>
    http.post<ChatMessage>(`/api/proyectos/${encodeURIComponent(input.proyectoId)}/chat`, {
      text: input.text,
    }),
};
