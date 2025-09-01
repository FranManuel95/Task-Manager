// src/store/chatStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ChatMessage } from "../types";

export interface ChatState {
  threads: Record<string, ChatMessage[]>;
  addMessage: (msg: ChatMessage) => void;
  editMessage: (proyectoId: string, id: string, text: string) => void;
  clearThread: (proyectoId: string) => void;
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
    }),
    { name: "chat-storage" }
  )
);
