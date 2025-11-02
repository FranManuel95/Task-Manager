import { useState, useRef, useEffect, useMemo } from "react";
import { useAuthStore } from "../../store/authStore";
import { useTareasStore } from "../../store/tareasStore";
import { useChatStore } from "../../store/chatStore";
import type { ChatMessage } from "../../types/chats";

type Props = {
  /** Puede ser el proyectoId (chat general) o un threadId (DM: "<projId>::dm::<a>::<b>") */
  chatId?: string;
  /** Compat con código antiguo: si no pasas chatId, se usa proyectoId */
  proyectoId?: string;
  className?: string;
};

const EMPTY: ReadonlyArray<ChatMessage> = Object.freeze([]) as ReadonlyArray<ChatMessage>;

const isDm = (id: string) => typeof id === "string" && id.includes("::dm::");
const projectFromId = (id: string) => (isDm(id) ? id.split("::dm::")[0] : id);

export default function ChatPanel({ chatId, proyectoId, className = "" }: Props) {
  // id efectivo del hilo (preferimos chatId)
  const id = useMemo(() => (chatId || proyectoId || "").trim(), [chatId, proyectoId]);

  const usuario = useAuthStore((s) => s.usuario);
  const email = (usuario?.email ?? "").trim().toLowerCase();

  // Necesitamos el proyecto para chequear permisos
  const tareasStore = useTareasStore();
  const proyecto = useMemo(() => {
    if (!id) return null;
    const projId = projectFromId(id);
    return tareasStore.getProyectoPorId?.(email, projId) ?? null;
  }, [id, email, tareasStore]);

  const puedeVer = !!proyecto && (proyecto.usuarios ?? []).includes(email);

  const threads = useChatStore((s) => s.threads);
  const loadHistory = useChatStore((s) => s.loadHistory);
  const subscribeThread = useChatStore((s) => s.subscribeThread);
  const sendMessage = useChatStore((s) => s.sendMessage);

  const messages: ReadonlyArray<ChatMessage> = id ? (threads[id] ?? EMPTY) : EMPTY;

  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  // Cargar histórico + suscripción SIEMPRE que cambie el id
  useEffect(() => {
    if (!id || !puedeVer) return;
    let unsub: (() => void) | undefined;

    (async () => {
      await loadHistory(id);
      unsub = subscribeThread(id);
    })();

    return () => {
      try {
        unsub?.();
      } catch {}
    };
  }, [id, puedeVer, loadHistory, subscribeThread]);

  // Auto-scroll al final cuando llegan mensajes
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  if (!id) return null;
  if (!puedeVer) return null;

  const handleSend = () => {
    const t = text.trim();
    if (!t || !email) return;
    void sendMessage(id, email, t);
    setText("");
  };

  const title = useMemo(() => {
    if (!id) return "Chat";
    if (isDm(id)) {
      const parts = id.split("::");
      const a = parts[2] ?? "";
      const b = parts[3] ?? "";
      const other = [a, b].find((x) => x && x !== email) ?? a ?? b ?? "DM";
      return `DM con ${other}`;
    }
    return `Chat del proyecto`;
  }, [id, email]);

  return (
    <div className={`border rounded-xl overflow-hidden ${className}`}>
      <div className="px-4 py-2 bg-gray-50 border-b dark:bg-neutral-900 dark:border-neutral-800">
        <h3 className="font-semibold text-sm">{title}</h3>
        {proyecto?.usuarios?.length ? (
          <p className="text-xs text-gray-500 dark:text-neutral-400">
            Participantes: {(proyecto.usuarios ?? []).join(", ")}
          </p>
        ) : null}
      </div>

      <div
        ref={listRef}
        className="h-64 overflow-y-auto p-3 space-y-2 bg-white dark:bg-neutral-950"
      >
        {messages.length === 0 && (
          <p className="text-center text-xs text-gray-500 dark:text-neutral-400 mt-8">
            Empieza la conversación ✨
          </p>
        )}

        {messages.map((m) => {
          const mine = m.sender === email;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow ${
                  mine
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900 dark:bg-neutral-800 dark:text-neutral-100"
                }`}
                title={new Date(m.ts).toLocaleString()}
              >
                {!mine && <div className="text-xs opacity-80 mb-1">{m.sender}</div>}
                <div className="whitespace-pre-wrap break-words">{m.text}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 bg-gray-50 border-t flex gap-2 dark:bg-neutral-900 dark:border-neutral-800">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          className="flex-1 resize-none rounded border px-3 py-2 text-sm dark:bg-neutral-950 dark:border-neutral-800"
          rows={2}
          placeholder="Escribe un mensaje (Enter para enviar, Shift+Enter para salto de línea)"
        />
        <button
          onClick={handleSend}
          className="self-end bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          disabled={!text.trim()}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
