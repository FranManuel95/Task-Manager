import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { useTareasStore } from "../../store/tareasStore";
import { useChatStore } from "../../store/chatStore";
import type { ChatMessage } from "../../types";

type Props = {
  proyectoId: string;
  className?: string;
};

// Fallback INMUTABLE y estable para evitar warnings y renders extra
const EMPTY_MESSAGES: ReadonlyArray<ChatMessage> = Object.freeze([]) as ReadonlyArray<ChatMessage>;

export default function ChatPanel({ proyectoId, className = "" }: Props) {
  const usuario = useAuthStore((s) => s.usuario);
  const email = usuario?.email ?? "";
  const proyecto = useTareasStore((s) => s.getProyectoPorId(email, proyectoId));
  const puedeVer = !!proyecto && (proyecto.usuarios ?? []).includes(email);

  // ✅ En v5 usa UN SOLO argumento (selector). Seleccionamos el objeto threads entero (estable)
  const threads = useChatStore((s) => s.threads);
  // Luego calculamos los mensajes con fallback constante (ya tipado):
  const messages: ReadonlyArray<ChatMessage> = threads[proyectoId] ?? EMPTY_MESSAGES;

  const loadHistory = useChatStore((s) => s.loadHistory);
  const subscribeThread = useChatStore((s) => s.subscribeThread);
  const sendMessage = useChatStore((s) => s.sendMessage);

  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  // Evita doble init en StrictMode (React dev)
  const didInitRef = useRef(false);

  useEffect(() => {
    if (!puedeVer) return;
    if (didInitRef.current) return;
    didInitRef.current = true;

    loadHistory?.(proyectoId);
    const unsub = subscribeThread?.(proyectoId);
    return () => unsub?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puedeVer, proyectoId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  if (!puedeVer) return null;

  const handleSend = () => {
    const t = text.trim();
    if (!t || !email) return;
    // El store ya hace optimismo + broadcast + persistencia
    sendMessage?.(proyectoId, email, t);
    setText("");
  };

  return (
    <div className={`mt-6 border rounded-xl overflow-hidden ${className}`}>
      <div className="px-4 py-2 bg-gray-50 border-b">
        <h3 className="font-semibold text-sm">Chat del proyecto</h3>
        <p className="text-xs text-gray-500">
          Participantes: {(proyecto?.usuarios ?? []).join(", ")}
        </p>
      </div>

      <div ref={listRef} className="h-64 overflow-y-auto p-3 space-y-2 bg-white">
        {messages.map((m) => {
          const mine = m.sender === email;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow
                ${mine ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"}`}
                title={new Date(m.ts).toLocaleString()}
              >
                {!mine && <div className="text-xs opacity-80 mb-1">{m.sender}</div>}
                <div className="whitespace-pre-wrap break-words">{m.text}</div>
              </div>
            </div>
          );
        })}

        {messages.length === 0 && (
          <p className="text-center text-xs text-gray-500 mt-8">
            Empieza la conversación ✨
          </p>
        )}
      </div>

      <div className="p-3 bg-gray-50 border-t flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          className="flex-1 resize-none rounded border px-3 py-2 text-sm"
          rows={2}
          placeholder="Escribe un mensaje (Enter para enviar, Shift+Enter para salto de línea)"
        />
        <button
          onClick={handleSend}
          className="self-end bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={!text.trim()}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
