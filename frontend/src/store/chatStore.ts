import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../services/api";
import type { ChatMessage } from "../types/chats";

/** Helpers de IDs */
const isDm = (id: string) => typeof id === "string" && id.includes("::dm::");
const projectFromId = (id: string) => (isDm(id) ? id.split("::dm::")[0] : id);
const bcName = (id: string) => `chat-${id}`; // id = proyectoId o threadId

type ChatState = {
  /** Mensajes por hilo (clave = proyectoId o threadId) */
  threads: Record<string, ChatMessage[]>;

  /** Carga el histórico de un hilo (general o DM) */
  loadHistory: (id: string) => Promise<void>;

  /** Suscribe a mensajes de BroadcastChannel para un hilo */
  subscribeThread: (id: string) => () => void;

  /** Envía un mensaje a un hilo (optimista + API si aplica) */
  sendMessage: (id: string, sender: string, text: string) => Promise<void>;
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      threads: {},

      loadHistory: async (id: string) => {
        if (!id) return;

        // Proyectos temporales => solo local
        if (id.startsWith("temp-")) {
          set((s) => ({
            threads: { ...s.threads, [id]: s.threads[id] ?? [] },
          }));
          return;
        }

        try {
          const items = isDm(id)
            ? await api.getThreadHistory(projectFromId(id), id)
            : await api.getChatHistory(id);

          set((s) => ({ threads: { ...s.threads, [id]: items } }));
        } catch (e) {
          console.warn("getChatHistory falló, se mantiene estado local:", e);
          set((s) => ({
            threads: { ...s.threads, [id]: s.threads[id] ?? [] },
          }));
        }
      },

      subscribeThread: (id: string) => {
        if (!id) return () => {};
        if (typeof window === "undefined" || !("BroadcastChannel" in window))
          return () => {};

        const channel = new BroadcastChannel(bcName(id));
        const onMsg = (ev: MessageEvent) => {
          const msg = ev.data as ChatMessage | undefined;
          if (!msg) return;
          // Aseguramos que el msg pertenece a este hilo (por si acaso)
          const belongs =
            (isDm(id) && msg.proyectoId === projectFromId(id)) ||
            (!isDm(id) && msg.proyectoId === id) ||
            true; // lo aceptamos en local

          if (!belongs) return;

          set((s) => {
            const list = s.threads[id] ?? [];
            if (list.some((m) => m.id === msg.id)) return s;
            return { threads: { ...s.threads, [id]: [...list, msg] } };
          });
        };

        channel.addEventListener("message", onMsg);

        return () => {
          channel.removeEventListener("message", onMsg);
          try {
            channel.close();
          } catch {}
        };
      },

      sendMessage: async (id: string, sender: string, text: string) => {
        const t = (text ?? "").trim();
        const from = (sender ?? "").trim().toLowerCase();
        if (!id || !from || !t) return;

        const msg: ChatMessage = {
          id:
            (globalThis.crypto as any)?.randomUUID?.() ??
            `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          proyectoId: projectFromId(id),
          sender: from,
          text: t,
          ts: new Date().toISOString(),
        };

        // Optimista
        set((s) => {
          const list = s.threads[id] ?? [];
          return { threads: { ...s.threads, [id]: [...list, msg] } };
        });

        // Broadcast local
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          new BroadcastChannel(bcName(id)).postMessage(msg);
        }

        // temp-* => no pegamos al backend
        if (id.startsWith("temp-")) return;

        try {
          if (isDm(id)) {
            await api.sendThreadMessage(projectFromId(id), id, from, t);
          } else {
            await api.sendChatMessage(id, from, t);
          }
        } catch (e) {
          console.warn("sendChatMessage falló, se deja el mensaje local:", e);
        }
      },
    }),
    { name: "chat-storage-v2" },
  ),
);
