import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import Testimonials from "../components/marketing/Testimonials";
import ThemeToggleButton from "../components/ui/DarkModeToggle";

type Feature = { title: string; desc: string; icon: React.ReactNode };
type FAQ = { q: string; a: string };

const features: Feature[] = [
  {
    title: "Kanban ultra fluido",
    desc: "Arrastra y suelta tareas entre columnas con animaciones suaves y atajos de teclado.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
        <path d="M4 5h5v14H4zM10 5h5v9h-5zM16 5h4v5h-4z" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Colaboración en tiempo real",
    desc: "Invita a tu equipo y editen juntos proyectos y tareas. Chat interno incluido.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
        <path d="M7 10a4 4 0 118 0 4 4 0 01-8 0zm-4 9a7 7 0 0116 0v1H3v-1z" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Enfoque sin fricción",
    desc: "Búsqueda, filtros por prioridad y avisos de deadline para que nada se te pase.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
        <path d="M12 22a10 10 0 100-20 10 10 0 000 20zm1-11h5v2h-7V6h2v5z" fill="currentColor" />
      </svg>
    ),
  },
];

const faqs: FAQ[] = [
  { q: "¿Puedo invitar a colaboradores?", a: "Sí. Cualquier colaborador puede crear, editar, mover y eliminar tareas del proyecto." },
  { q: "¿Tiene chat integrado?", a: "Si. Tiene un chat general, además de poder hablar individualmente con cada colaborador. Cada chat es totalmente dependiente de cada proyecto" },
  { q: "¿Como funciona el deadline?", a: "Cada proyecto tiene un deadline. A su vez cada tarea tendrá un deadline que no podrá superar el deadline del proyecto." },
];

// --- añade este pequeño componente (por ejemplo, encima de export default function Home) ---
function ThemeLogo() {
  return (
    <div className="flex items-center">
      {/* Logo claro -> visible en modo claro */}
      <img
        src="/LogoTask-Manager2.png"
        alt="Logo"
        className="h-40 w-auto block dark:hidden"
      />
      {/* Logo blanco -> visible en dark mode */}
      <img
        src="/LogoTaskBlanco.png"
        alt="Logo"
        className="h-25 w-auto hidden dark:block p-2"
      />
    </div>
  );
}

export default function Home() {
  const usuario = useAuthStore((s) => s.usuario);
  const navigate = useNavigate();

  useEffect(() => {
    if (usuario) navigate("/dashboard");
  }, [usuario, navigate]);

  return (
    <div className="relative min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      {/* Fondo */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl opacity-25 bg-gradient-to-tr from-blue-500 to-cyan-400" />
        <div className="absolute -bottom-24 -right-24 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-20 bg-gradient-to-tr from-fuchsia-500 to-purple-400" />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-20 backdrop-blur bg-white/70 dark:bg-gray-950/60 border-b border-black/5 dark:border-white/10">
  <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 mt-2 mb-2">
    <div className="flex items-center gap-3">
      <ThemeLogo />
    </div>

    <div className="hidden items-center gap-6 text-sm md:flex">
      <a href="#features" className="hover:opacity-80">Características</a>
      <a href="#how" className="hover:opacity-80">Cómo funciona</a>
      <a href="#faq" className="hover:opacity-80">FAQ</a>
      <ThemeToggleButton /> {/* <- aquí */}
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        Ir a la app
        <span aria-hidden>↗</span>
      </Link>
    </div>
          <div className="md:hidden">
            <a
              href="#features"
              className="text-sm px-3 py-1 rounded-lg border border-black/10 dark:border-white/10 bg-white/70 dark:bg-gray-900/60"
            >
              Menú
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main>
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-12 sm:pt-24 sm:pb-16">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                Gestiona tus proyectos con{" "}
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  claridad y velocidad
                </span>
                .
              </h1>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                Un tablero Kanban rápido, colaborativo y sin fricciones. Crea tareas, colabora con tu equipo y mantén los deadlines bajo control.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                {/* Botones primario/secundario consistentes */}
                <Link
                  to="/login"
                  className="rounded-xl bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl border border-blue-600 px-6 py-2 text-blue-600 hover:bg-blue-50 transition dark:hover:bg-blue-950/20 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  Registrarse
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 opacity-80 lg:justify-start">
                <LogoBadge text="React + TS" />
                <LogoBadge text="Tailwind" />
                <LogoBadge text="Zustand" />
                <LogoBadge text="Vite" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative"
            >
              <div className="rounded-2xl border border-black/10 bg-white/70 p-3 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-gray-900/60">
                <img
                  src="/CapturaProyectoTareas.png"
                  alt="Vista previa del tablero Kanban"
                  className="w-full rounded-xl object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 hidden sm:block">
                <KPIChip value="+35%" label="más tareas completadas" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-black/5 dark:border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <SectionHeading kicker="Características" title="Todo lo que necesitas para ejecutar" subtitle="Sin configuraciones complejas ni distracciones." />
           <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
  {features.map((f, i) => (
    <motion.div
      key={f.title}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: i * 0.06 }}
      className="rounded-xl border border-black/10 bg-white/60 p-5 backdrop-blur hover:shadow-lg transition dark:border-white/10 dark:bg-gray-900/60 flex flex-col items-center text-center"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-700 dark:text-blue-300">
        {f.icon}
      </div>
      <h3 className="mt-4 font-semibold">{f.title}</h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{f.desc}</p>
    </motion.div>
  ))}
</div>

          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-t border-black/5 dark:border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <SectionHeading kicker="Cómo funciona" title="De cero a flujo en minutos" subtitle="Crea un proyecto, invita a tu equipo y empieza a mover tareas." />
            <ol className="counter-steps mt-10 grid gap-6 md:grid-cols-3">
              {[
                { t: "Crea tu proyecto", d: "Define nombre, color y deadline opcional." },
                { t: "Invita a tu equipo", d: "Comparte el proyecto y chatead dentro." },
                { t: "Planifica y ejecuta", d: "Agrega tareas, define prioridades y cumple fechas." },
              ].map((s, i) => (
                <li key={s.t} className="relative rounded-xl border border-black/10 bg-white/60 p-6 dark:border-white/10 dark:bg-gray-900/60">
                  <span className="step-index absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <h4 className="font-semibold">{s.t}</h4>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <Testimonials className="border-t border-black/5 dark:border-white/10" />

        {/* FAQ */}
        <section id="faq" className="border-t border-black/5 dark:border-white/10">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
            <SectionHeading kicker="FAQ" title="Preguntas frecuentes" subtitle="Las dudas típicas, resueltas." />
            <div className="mt-10 overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
              {faqs.map((f) => (
                <details key={f.q} className="group open:bg-black/[0.02] dark:open:bg-white/[0.03]">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
                    <span className="font-medium">{f.q}</span>
                    <span className="transition group-open:rotate-180" aria-hidden>
                      ⌄
                    </span>
                  </summary>
                  <div className="px-5 pb-5 pt-1 text-sm text-gray-600 dark:text-gray-300">{f.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-black/5 dark:border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold sm:text-4xl">¿Listo para elevar tu ejecución?</h2>
            <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">
              Crea un proyecto en segundos y empieza a entregar con foco.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              {/* Misma apariencia en light/dark */}
              <Link
                to="/dashboard"
                className="inline-flex rounded-xl bg-blue-600 px-5 py-3 text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                Crear proyecto
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/5 dark:border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm sm:flex-row sm:px-6 lg:px-8">
          <p className="opacity-70">
            © {new Date().getFullYear()} Task Manager. Todos los derechos reservados.
          </p>
          <nav className="flex gap-4 opacity-80">
            <a href="#" className="hover:opacity-100">Privacidad</a>
            <a href="#" className="hover:opacity-100">Términos</a>
            <a href="#" className="hover:opacity-100">Contacto</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/* ---------------- small atoms ---------------- */
function SectionHeading({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <span className="text-xs uppercase tracking-widest text-blue-600 dark:text-blue-400">
        {kicker}
      </span>
      <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-gray-600 dark:text-gray-300">{subtitle}</p>}
    </div>
  );
}

function KPIChip({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/80 px-4 py-2 shadow backdrop-blur dark:border-white/10 dark:bg-gray-900/80">
      <span className="font-semibold">{value}</span>{" "}
      <span className="text-sm opacity-70">{label}</span>
    </div>
  );
}

function LogoBadge({ text }: { text: string }) {
  return (
    <div className="text-xs rounded-full border border-black/10 bg-white/50 px-3 py-1.5 backdrop-blur dark:border-white/10 dark:bg-gray-900/50">
      {text}
    </div>
  );
}
