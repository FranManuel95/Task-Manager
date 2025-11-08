// src/services/api.ts
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

/* ----------------- Utilidades / Infra ----------------- */

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
  get: <T>(path: string, params?: Record<string, unknown>) =>
    request<T>(`${path}${toQuery(params)}`),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body == null ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body == null ? undefined : JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

/* ----------------- Helpers chat ----------------- */

// Convención: "<proyectoId>::dm::<otra-cosa>"
export function isThreadId(id: string): boolean {
  return typeof id === "string" && id.includes("::dm::");
}

export function getProyectoIdFromThreadId(threadId: string): string {
  if (!isThreadId(threadId)) return threadId;
  return threadId.split("::dm::")[0] || "";
}

// Normaliza respuestas variadas a ChatMessage[]
function normalizeMessages(res: any): ChatMessage[] {
  if (Array.isArray(res)) return res as ChatMessage[];
  if (Array.isArray(res?.items)) return res.items as ChatMessage[];
  if (Array.isArray(res?.data)) return res.data as ChatMessage[];
  return [] as ChatMessage[];
}

/* ----------------- API pública ----------------- */

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
    http.post<Tarea>(`/api/proyectos/${encodeURIComponent(proyectoId)}/tareas`, {
      ...dto,
      estado,
    }),

  updateTarea: (proyectoId: string, tareaId: string, dto: UpdateTareaDTO) =>
    http.patch<Tarea>(
      `/api/proyectos/${encodeURIComponent(proyectoId)}/tareas/${encodeURIComponent(tareaId)}`,
      dto
    ),

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

  /** Chat (general por proyecto) */
  getChatHistory: async (proyectoId: string, params?: { page?: number; pageSize?: number }) => {
    const res = await http.get<any>(
      `/api/proyectos/${encodeURIComponent(proyectoId)}/chat`,
      params
    );
    return normalizeMessages(res);
  },

  sendChatMessage: (proyectoId: string, sender: string, text: string) =>
    http.post<ChatMessage>(`/api/proyectos/${encodeURIComponent(proyectoId)}/chat`, {
      sender,
      text,
    }),

  /** Chat — Threads (DMs) */
  getThreadHistory: async (proyectoId: string, threadId: string) => {
    try {
      const path = `/api/proyectos/${encodeURIComponent(
        proyectoId
      )}/chat/threads/${encodeURIComponent(threadId)}`;
      const res = await http.get<any>(path);
      return normalizeMessages(res);
    } catch (e: any) {
      if (e?.status === 404) return [] as ChatMessage[];
      throw e;
    }
  },

  sendThreadMessage: async (proyectoId: string, threadId: string, sender: string, text: string) => {
    const path = `/api/proyectos/${encodeURIComponent(
      proyectoId
    )}/chat/threads/${encodeURIComponent(threadId)}`;
    return http.post<ChatMessage>(path, { sender, text });
  },

  /** Utilidad: historial por id genérico (proyectoId o threadId) */
  getAnyChatHistory: async (id: string) => {
    if (!id) return [] as ChatMessage[];
    if (isThreadId(id)) {
      const projId = getProyectoIdFromThreadId(id);
      if (!projId) return [] as ChatMessage[];
      return api.getThreadHistory(projId, id);
    }
    return api.getChatHistory(id);
  },

  /** Utilidad: enviar por id genérico (proyectoId o threadId) */
  sendAnyMessage: async (id: string, sender: string, text: string) => {
    if (!id || !sender || !text) return;
    if (isThreadId(id)) {
      const projId = getProyectoIdFromThreadId(id);
      if (!projId) throw new ApiError("threadId inválido (no contiene proyectoId)", 400);
      return api.sendThreadMessage(projId, id, sender, text);
    }
    return api.sendChatMessage(id, sender, text);
  },

  /** Auditoría */
  getAudit: async (proyectoId: string) => {
    const res = await http.get<any>(`/api/proyectos/${encodeURIComponent(proyectoId)}/audit`);
    const page = normalizeAuditPage(res);
    return page.items;
  },
};

/* ----------------- Auth ----------------- */

export type RegisterPayload = {
  email: string;
  password: string;
  name?: string;
  avatarUrl?: string;
  birthdate?: string;
  jobTitle?: string;
  phone?: string;
};

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
};

export const authApi = {
  register: (payload: RegisterPayload) =>
    http.post<{ ok: true }>("/api/auth/register", payload),

  login: (email: string, password: string) =>
    http.post<{ email: string; name?: string | null; avatarUrl?: string | null }>(
      "/api/auth/login",
      { email, password }
    ),

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

/* ----------------- Auditoría ----------------- */

export type AuditDiff = Record<string, { before: any; after: any }>;

export type AuditPayload = {
  entityName?: string | null;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  diff?: AuditDiff | null;
} | null;

export type AuditItem = {
  id: string;
  ts?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  proyectoId: string;
  entity: string;
  entityId: string | null;
  action: string;
  actorEmail: string;
  actorName?: string | null;
  displayName?: string | null;
  payload?: AuditPayload;
};

export type AuditPage = {
  items: AuditItem[];
  nextCursor?: string | null;
};

function pickDisplayNameLike(item: AuditItem): string | null {
  const p = item.payload ?? undefined;
  const before = (p?.before ?? undefined) as Record<string, any> | undefined;
  const after = (p?.after ?? undefined) as Record<string, any> | undefined;
  const diff = (p?.diff ?? undefined) as Record<string, any> | undefined;

  const fromAfter = (after && (after.nombre || after.titulo || after.entityName)) || null;
  if (fromAfter) return String(fromAfter);

  const fromBefore = (before && (before.nombre || before.titulo || before.entityName)) || null;
  if (fromBefore) return String(fromBefore);

  const fromDiff =
    (diff &&
      (diff.nombre?.after || diff.titulo?.after || diff.entityName?.after)) ||
    null;
  if (fromDiff) return String(fromDiff);

  if (p?.entityName) return String(p.entityName);
  if (item.displayName) return String(item.displayName);
  return null;
}

function normalizeAuditItem(raw: any): AuditItem {
  const item: AuditItem = {
    ...raw,
    payload: {
      entityName: raw?.payload?.entityName ?? null,
      before: raw?.payload?.before ?? null,
      after: raw?.payload?.after ?? null,
      diff: raw?.payload?.diff ?? null,
    },
  };

  item.ts = item.ts ?? item.createdAt ?? item.created_at ?? null;

  if (!item.displayName) {
    const dn = pickDisplayNameLike(item);
    if (dn) item.displayName = dn;
  }

  return item;
}

function normalizeAuditPage(res: any): AuditPage {
  const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
  return {
    items: items.map(normalizeAuditItem),
    nextCursor: res?.nextCursor ?? null,
  };
}

export const audit = {
  list: async (proyectoId: string, params?: { limit?: number; cursor?: string }) => {
    const res = await http.get<any>(
      `/api/proyectos/${encodeURIComponent(proyectoId)}/audit`,
      params as any
    );
    return normalizeAuditPage(res);
  },
};
