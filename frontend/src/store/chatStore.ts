// src/store/chatStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ChatMessage } from "../types";
import { LocalBroadcastTransport } from "../services/chat/LocalBroadcastTransport";
import { api } from "../services/api";

const transport = new LocalBroadcastTransport();

export interface ChatState {
  threads: Record<string, ChatMessage[]>;
  addMessage: (msg: ChatMessage) => void;
  editMessage: (proyectoId: string, id: string, text: string) => void;
  clearThread: (proyectoId: string) => void;

  /** Carga histórico desde backend (opcional). */
  loadHistory?: (proyectoId: string) => void;

  /** Enviar mensaje: broadcast local + persistir en backend (opcional). */
  sendMessage?: (proyectoId: string, sender: string, text: string) => void;

  /** Suscripción local entre pestañas al hilo (opcional). Devuelve un unsubscribe. */
  subscribeThread?: (proyectoId: string) => () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      threads: {},
      addMessage: (msg) =>
        set((state) => {
          const list = state.threads[msg.proyectoId] ?? [];
          if (list.some((m) => m.id === msg.id)) return state; // dedupe
          return {
            threads: {
              ...state.threads,
              [msg.proyectoId]: [...list, msg],
            },
          };
        }),
      editMessage: (proyectoId, id, text) =>
        set((state) => {
          const list = state.threads[proyectoId] ?? [];
          return {
            threads: {
              ...state.threads,
              [proyectoId]: list.map((m) =>
                m.id === id ? { ...m, text, edited: true } : m
              ),
            },
          };
        }),
      clearThread: (proyectoId) =>
        set((state) => {
          const { [proyectoId]: _omit, ...rest } = state.threads;
          return { threads: rest };
        }),

      // --- Integraciones opcionales con backend/broadcast ---
      loadHistory: (proyectoId: string) => {
        void (async () => {
          try {
            const page = await api.getChatHistory(proyectoId, { page: 1, pageSize: 50 });
            set((state) => ({
              threads: {
                ...state.threads,
                [proyectoId]: page.items,
              },
            }));
          } catch (err) {
            console.warn("getChatHistory falló, se mantiene estado local:", err);
          }
        })();
      },

      sendMessage: (proyectoId: string, sender: string, text: string) => {
        const msg: ChatMessage = {
          id: crypto.randomUUID(),
          proyectoId,
          sender,
          text,
          ts: new Date().toISOString(),
        };

        // Optimista + broadcast local
        get().addMessage(msg);
        void transport.send(proyectoId, msg);

        // Persistencia backend
        void (async () => {
          try {
            const saved = await api.sendChatMessage({ proyectoId, text });
            // Opcional: reconciliar id local con el id real del backend
            set((state) => {
              const list = state.threads[proyectoId] ?? [];
              const idx = list.findIndex((m) => m.id === msg.id);
              if (idx === -1) return state;
              const next = [...list];
              next[idx] = saved; // sustituye por el mensaje devuelto por la API
              return { threads: { ...state.threads, [proyectoId]: next } };
            });
          } catch (err) {
            console.warn("sendChatMessage falló, se deja el mensaje local:", err);
          }
        })();
      },

      subscribeThread: (proyectoId: string) => {
        const unsub = transport.subscribe(proyectoId, (incoming) => {
          // Evitar duplicados si ya existe
          const list = get().threads[proyectoId] ?? [];
          if (list.some((m) => m.id === incoming.id)) return;
          set((state) => ({
            threads: {
              ...state.threads,
              [proyectoId]: [...(state.threads[proyectoId] ?? []), incoming],
            },
          }));
        });
        return unsub;
      },
    }),
    { name: "chat-storage" }
  )
);
