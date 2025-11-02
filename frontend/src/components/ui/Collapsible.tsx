// frontend/src/components/ui/Collapsible.tsx
import { PropsWithChildren, useId } from "react";
import { motion, AnimatePresence } from "motion/react";

type Props = {
  title: string;
  isOpen: boolean;
  onToggle: (v: boolean) => void;
  className?: string;
  /** Se renderiza a la derecha del título, como hermano del botón de toggle (no dentro). */
  headerRight?: React.ReactNode;
};

export default function Collapsible({
  title,
  isOpen,
  onToggle,
  className,
  headerRight,
  children,
}: PropsWithChildren<Props>) {
  const contentId = useId();

  return (
    <div className={className}>
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-2 py-1.5 sm:px-3">
          <button
            type="button"
            onClick={() => onToggle(!isOpen)}
            className="group inline-flex items-center gap-2 rounded-xl px-2 py-1 text-left transition hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200"
            aria-expanded={isOpen}
            aria-controls={contentId}
          >
            <span className="text-sm font-semibold">{title}</span>
            <span
              className={`text-gray-500 transition-transform group-hover:text-gray-700 ${isOpen ? "rotate-90" : ""}`}
              aria-hidden
            >
              ▶
            </span>
          </button>

          {headerRight && <div className="ml-2">{headerRight}</div>}
        </div>

        {/* Contenido */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              id={contentId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="border-t"
            >
              <div className="p-3">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
