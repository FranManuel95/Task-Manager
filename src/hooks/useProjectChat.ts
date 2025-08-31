// src/hooks/useProjectChat.ts
import { useEffect, useMemo } from "react";
import { ChatMessage } from "@/types";
import { useChatStore } from "@/store/chatStore";
import { LocalBroadcastTransport } from "@/services/chat/LocalBroadcastTransport";

const transport = new LocalBroadcastTransport();

// Fallback estable y tipado como readonly (coherente con freeze)
const EMPTY_MESSAGES: ReadonlyArray<ChatMessage> =
  Object.freeze([]) as ReadonlyArray<ChatMessage>;

type UseProjectChatReturn = {
  messages: ReadonlyArray<ChatMessage>;
  send: (msg: ChatMessage) => Promise<void>;
};

export function useProjectChat(proyectoId?: string): UseProjectChatReturn {
  const pid = proyectoId ?? "__none__";

  // ❗Sin equality fn (2º argumento) para evitar el error de TS en tu versión
  const messages = useChatStore((s) => {
    const arr = s.threads[pid];
    return (arr ?? EMPTY_MESSAGES) as ReadonlyArray<ChatMessage>;
  });

  const addMessage = useChatStore((s) => s.addMessage);

  useEffect(() => {
    if (!proyectoId) return;
    const unsubscribe = transport.subscribe(proyectoId, (msg) => addMessage(msg));
    return unsubscribe;
  }, [proyectoId, addMessage]);

  const send = useMemo(
    () => async (msg: ChatMessage) => {
      addMessage(msg); // pinta local
      await transport.send(msg.proyectoId, msg); // broadcast
    },
    [addMessage]
  );

  return { messages, send };
}
