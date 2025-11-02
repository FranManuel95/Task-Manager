import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import ChatPanel from "./ChatPanel";
import { useAuthStore } from "../../store/authStore";
import { useTareasStore } from "../../store/tareasStore";
import { useChatStore } from "../../store/chatStore";

type Props = { proyectoId: string };

/** Genera un threadId estable para DMs: proyectoId::dm::<a>::<b> (emails ordenados) */
function makeDmThreadId(projectId: string, me: string, targetEmail: string) {
  const a = (me || "").trim().toLowerCase();
  const b = (targetEmail || "").trim().toLowerCase();
  const [e1, e2] = [a, b].sort();
  return `${projectId}::dm::${e1}::${e2}`;
}

export default function ChatDock({ proyectoId }: Props) {
  const usuario = useAuthStore((s) => s.usuario);
  const email = (usuario?.email ?? "").trim().toLowerCase();
  const proyecto = useTareasStore((s) => s.getProyectoPorId(email, proyectoId));
  const miembros: string[] = useMemo(
    () => (proyecto?.usuarios ?? []).filter(Boolean),
    [proyecto?.usuarios]
  );

  // Para badge de no leídos en el chat general
  const threads = useChatStore((s) => s.threads);
  const generalMsgs = threads[proyectoId] ?? [];

  // UI state
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"general" | "dm">("general");
  const [activeDm, setActiveDm] = useState<string | null>(null);

  // Unread badge
  const [unread, setUnread] = useState(0);
  const lastCountRef = useRef(generalMsgs.length);

  useEffect(() => {
    const curr = generalMsgs.length;
    const prev = lastCountRef.current;
    if (!open && curr > prev) setUnread((u) => u + (curr - prev));
    lastCountRef.current = curr;
  }, [generalMsgs.length, open]);

  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  // Si cambia miembros, validamos DM activo
  useEffect(() => {
    if (activeDm && !miembros.includes(activeDm)) {
      setActiveDm(null);
      setActiveTab("general");
    }
  }, [miembros, activeDm]);

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = miembros.filter((m) => m !== email);
    return q ? base.filter((m) => m.toLowerCase().includes(q)) : base;
  }, [miembros, email, query]);

  const currentChatId =
    activeTab === "general" || !activeDm
      ? proyectoId
      : makeDmThreadId(proyectoId, email, activeDm);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Panel flotante */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chatdock"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="mb-3 w-[360px] overflow-hidden rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] shadow-xl"
          >
            {/* Header con tabs y botón cerrar */}
            <div className="border-b border-[rgb(var(--color-border))]">
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveTab("general")}
                    className={`rounded-lg px-2 py-1 text-sm ${
                      activeTab === "general"
                        ? "bg-indigo-600 text-white"
                        : "hover:bg-[rgb(var(--color-card))]/70"
                    }`}
                  >
                    General
                  </button>
                  <button
                    onClick={() => setActiveTab("dm")}
                    className={`rounded-lg px-2 py-1 text-sm ${
                      activeTab === "dm"
                        ? "bg-indigo-600 text-white"
                        : "hover:bg-[rgb(var(--color-card))]/70"
                    }`}
                  >
                    Mensajes
                  </button>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-1 text-sm hover:bg-[rgb(var(--color-card))]/70"
                  title="Cerrar"
                >
                  ×
                </button>
              </div>

              {/* Buscador de miembros (solo en DM) */}
              {activeTab === "dm" && (
                <div className="px-3 pb-3">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar personas…"
                    className="w-full rounded-lg border border-[rgb(var(--color-border))] bg-transparent px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition"
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
                    {filteredMembers.length === 0 && (
                      <div className="text-xs text-gray-500">Sin resultados</div>
                    )}
                    {filteredMembers.map((m) => {
                      const selected = activeDm === m;
                      const ini = m.charAt(0).toUpperCase();
                      return (
                        <button
                          key={m}
                          onClick={() => {
                            setActiveDm(m);
                            setActiveTab("dm");
                          }}
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition ${
                            selected
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300"
                              : "border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-card))]/70"
                          }`}
                          title={m}
                        >
                          <span className="grid h-5 w-5 place-items-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-700 dark:bg-neutral-700 dark:text-neutral-100">
                            {ini}
                          </span>
                          <span className="truncate max-w-[160px]">{m}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Cuerpo: ChatPanel (general o dm) */}
            <div className="h-[440px]">
              <ChatPanel chatId={currentChatId} className="h-full" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón flotante 💬 con badge */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="relative flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition hover:bg-indigo-700"
          title="Abrir chat"
        >
          💬
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white shadow">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
