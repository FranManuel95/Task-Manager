import { useEffect, useMemo } from "react";
import type { ChatMessage } from "../types";
import { useChatStore } from "../store/chatStore";

const EMPTY: ReadonlyArray<ChatMessage> = Object.freeze([]) as ReadonlyArray<ChatMessage>;

type UseProjectChatReturn = {
  messages: ReadonlyArray<ChatMessage>;
  /** Envía un mensaje. Se persiste en backend y se hace broadcast local. */
  send: (msg: ChatMessage) => Promise<void>;
};

export function useProjectChat(proyectoId?: string): UseProjectChatReturn {
  const pid = proyectoId ?? "__none__";

  const messages = useChatStore((s) => (s.threads[pid] ?? EMPTY) as ReadonlyArray<ChatMessage>);
  const loadHistory = useChatStore((s) => s.loadHistory);
  const subscribeThread = useChatStore((s) => s.subscribeThread);
  const sendMessage = useChatStore((s) => s.sendMessage);

  useEffect(() => {
    if (!proyectoId) return;
    // cargar histórico y suscribir broadcast local (entre pestañas)
    loadHistory?.(proyectoId);
    const unsub = subscribeThread?.(proyectoId);
    return () => unsub?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoId]);

  const send = useMemo(
    () => async (msg: ChatMessage) => {
      if (!proyectoId) return;
      // Importante: no añadimos manualmente a la store para evitar duplicados.
      // El store ya hace optimismo + broadcast + persistencia.
      sendMessage?.(proyectoId, msg.sender, msg.text);
      // Normalizamos a Promise para mantener la firma Promise<void>
      return;
    },
    [proyectoId, sendMessage]
  );

  return { messages, send };
}
