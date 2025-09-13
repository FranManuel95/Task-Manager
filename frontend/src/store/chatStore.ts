// src/store/chatStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../services/api";
import type { ChatMessage } from "../types/chats";

type ChatState = {
  threads: Record<string, ChatMessage[]>;
  loadHistory: (proyectoId: string) => Promise<void>;
  subscribeThread: (proyectoId: string) => () => void;
  sendMessage: (proyectoId: string, sender: string, text: string) => Promise<void>;
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      threads: {},

      loadHistory: async (proyectoId: string) => {
        if (!proyectoId) return;
        if (proyectoId.startsWith("temp-")) {
          set((s) => ({ threads: { ...s.threads, [proyectoId]: s.threads[proyectoId] ?? [] } }));
          return;
        }
        try {
          const items = await api.getChatHistory(proyectoId);
          set((s) => ({ threads: { ...s.threads, [proyectoId]: items } }));
        } catch (e) {
          console.warn("getChatHistory falló, se mantiene estado local:", e);
          set((s) => ({ threads: { ...s.threads, [proyectoId]: s.threads[proyectoId] ?? [] } }));
        }
      },

      subscribeThread: (proyectoId: string) => {
        if (!proyectoId) return () => {};
        if (typeof window === "undefined" || !("BroadcastChannel" in window)) return () => {};
        const bc = new BroadcastChannel(`chat-${proyectoId}`);
        const handler = (ev: MessageEvent) => {
          const msg = ev.data as ChatMessage;
          if (!msg || msg.proyectoId !== proyectoId) return;
          set((s) => {
            const list = s.threads[proyectoId] ?? [];
            if (list.some((m) => m.id === msg.id)) return s;
            return { threads: { ...s.threads, [proyectoId]: [...list, msg] } };
          });
        };
        bc.addEventListener("message", handler);
        return () => bc.removeEventListener("message", handler);
      },

      sendMessage: async (proyectoId, sender, text) => {
        const t = (text ?? "").trim();
        const senderLower = (sender ?? "").trim().toLowerCase();
        if (!proyectoId || !senderLower || !t) return;

        const msg: ChatMessage = {
          id:
            (globalThis.crypto as any)?.randomUUID?.() ??
            `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          proyectoId,
          sender: senderLower,
          text: t,
          ts: new Date().toISOString(),
        };

        // Optimismo
        set((s) => {
          const list = s.threads[proyectoId] ?? [];
          return { threads: { ...s.threads, [proyectoId]: [...list, msg] } };
        });

        // Broadcast local
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          new BroadcastChannel(`chat-${proyectoId}`).postMessage(msg);
        }

        if (proyectoId.startsWith("temp-")) return; // no pegamos al backend aún

        try {
          await api.sendChatMessage(proyectoId, senderLower, t);
        } catch (e) {
          console.warn("sendChatMessage falló, se deja el mensaje local:", e);
        }
      },
    }),
    { name: "chat-storage" }
  )
);
