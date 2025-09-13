import { useEffect, useMemo } from "react";
import type { ChatMessage } from "../types";
import { useChatStore } from "../store/chatStore";

const EMPTY: ReadonlyArray<ChatMessage> = Object.freeze([]) as ReadonlyArray<ChatMessage>;

type UseProjectChatReturn = {
  messages: ReadonlyArray<ChatMessage>;
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
    // Evita id temporales
    if (proyectoId.startsWith("temp-")) {
      // Aun así suscríbete a BroadcastChannel local
      const unsub = subscribeThread?.(proyectoId);
      return () => unsub?.();
    }
    (async () => {
      await loadHistory?.(proyectoId);
      const unsub = subscribeThread?.(proyectoId);
      return () => unsub?.();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoId]);

  const send = useMemo(
    () => async (msg: ChatMessage) => {
      if (!proyectoId) return;
      await sendMessage?.(proyectoId, msg.sender, msg.text);
    },
    [proyectoId, sendMessage]
  );

  return { messages, send };
}
