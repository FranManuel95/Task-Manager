import { useEffect, useRef, useState, useId } from "react";
import { AnimatePresence, motion } from "motion/react";

type Testimonial = {
  id: string;
  name: string;
  role: string;
  quote: string;
  avatar: string;
};

type Props = {
  items?: Testimonial[];
  intervalMs?: number;
  className?: string;
};

const DEFAULT_ITEMS: Testimonial[] = [
  {
    id: "gino",
    name: "Gino",
    role: "Product Manager",
    quote:
      "Pasamos de hojas sueltas a un tablero Kanban claro. Las prioridades y los avisos de deadline nos dieron foco y el equipo entrega mejor.",
    avatar: "/testimonials/cliente1.svg",
  },
  {
    id: "meri",
    name: "Meri",
    role: "Tech Lead Frontend",
    quote:
      "La colaboración es impecable: invitamos al equipo, editamos tareas en paralelo y el chat interno evita perder contexto.",
    avatar: "/testimonials/cliente2.svg",
  },
  {
    id: "murphy",
    name: "Murphy",
    role: "Diseñador UX",
    quote:
      "Me encanta lo simple que es priorizar y mover tareas. El flujo visual y las etiquetas nos ayudan a mantener la experiencia alineada con los plazos.",
    avatar: "/testimonials/cliente3.svg",
  },
];

export default function Testimonials({
  items = DEFAULT_ITEMS,
  intervalMs = 6000,
  className = "",
}: Props) {
  const [index, setIndex] = useState(0);
  const total = items.length;
  const timerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const regionId = useId();

  const goTo = (i: number) => setIndex((i + total) % total);
  const next = () => setIndex((i) => (i + 1) % total);
  const prev = () => setIndex((i) => (i - 1 + total) % total);

  // autoplay con pausa al hover/focus (sin stale closures)
  useEffect(() => {
    const node = containerRef.current;

    const stop = () => {
      if (timerRef.current != null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    const start = () => {
      if (timerRef.current != null) return;
      timerRef.current = window.setInterval(() => {
        setIndex((i) => (i + 1) % total);
      }, intervalMs) as unknown as number;
    };

    start();

    node?.addEventListener("mouseenter", stop);
    node?.addEventListener("mouseleave", start);
    node?.addEventListener("focusin", stop);
    node?.addEventListener("focusout", start);

    return () => {
      stop();
      node?.removeEventListener("mouseenter", stop);
      node?.removeEventListener("mouseleave", start);
      node?.removeEventListener("focusin", stop);
      node?.removeEventListener("focusout", start);
    };
  }, [intervalMs, total]);

  // swipe básico en móvil
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) =>
    (touchStartX.current = e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) (delta < 0 ? next : prev)();
    touchStartX.current = null;
  };

  const current = items[index];

  return (
    <section
      id="testimonios"
      className={`py-16 ${className}`}
      aria-labelledby={`${regionId}-title`}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2
          id={`${regionId}-title`}
          className="text-3xl sm:text-4xl font-bold text-center"
        >
          Testimonios
        </h2>
        <p className="text-center mt-2 text-gray-600 dark:text-gray-300">
          Esto son algunos testimonios de nuestros usuarios
        </p>

        <div
          ref={containerRef}
          className="relative mt-10 rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-gray-900/60 backdrop-blur overflow-hidden"
          role="region"
          aria-roledescription="carousel"
          aria-label="Carrusel de testimonios"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Slide actual con animación */}
          <div className="min-h-[300px] flex items-center justify-center px-6 py-10">
            <AnimatePresence mode="wait">
              <motion.figure
                key={current.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.35 }}
                className="text-center max-w-2xl"
                aria-live="polite"
              >
                <img
                  src={current.avatar}
                  alt={`Foto de ${current.name}`}
                  className="mx-auto w-20 h-20 rounded-full object-cover ring-2 ring-blue-600/20"
                  loading="lazy"
                />
                <blockquote className="mt-6 text-lg leading-relaxed">
                  “{current.quote}”
                </blockquote>
                <figcaption className="mt-4">
                  <div className="font-medium">{current.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {current.role}
                  </div>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>

          {/* Controles */}
          <div className="absolute inset-y-0 left-0 flex items-center pl-2">
            <button
              type="button"
              onClick={prev}
              aria-label="Anterior"
              className="rounded-full p-2 bg-white/80 dark:bg-gray-800/80 border border-black/10 dark:border-white/10 shadow hover:bg-white dark:hover:bg-gray-800"
            >
              <ChevronLeft />
            </button>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            <button
              type="button"
              onClick={next}
              aria-label="Siguiente"
              className="rounded-full p-2 bg-white/80 dark:bg-gray-800/80 border border-black/10 dark:border-white/10 shadow hover:bg-white dark:hover:bg-gray-800"
            >
              <ChevronRight />
            </button>
          </div>

          {/* Indicadores */}
          <div className="flex items-center justify-center gap-2 pb-4">
            {items.map((t, i) => {
              const active = i === index;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-label={`Ir al testimonio ${i + 1}`}
                  aria-current={active ? "true" : undefined}
                  onClick={() => goTo(i)}
                  className={`h-2.5 rounded-full transition-all ${
                    active
                      ? "w-6 bg-blue-600"
                      : "w-2.5 bg-gray-400/60 hover:bg-gray-500/80"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* --- Iconos simples (SVG inline) --- */
function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
